import { Injectable } from "@nestjs/common";
import { eq, ne, sql } from "drizzle-orm";
import { ambulanceProviders, bookings } from "@/common/database/schema";
import type { Booking, Hospital, User } from "@/common/database/schema";
import { and } from "drizzle-orm";
import { or } from "drizzle-orm";
import { DbService } from "@/common/database/db.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { SocketService } from "@/common/socket/socket.service";
import { DriverLocationUpdate } from "@/common/types/socket.types";

@Injectable()
export class BookingService {
  constructor(
    private dbService: DbService,
    private dispatcherService: DispatcherService,
    private socketService: SocketService
  ) {}

  async createBooking(
    patient: User,
    _patientLat: number,
    _patientLng: number,
    pickupAddr: string | null,
    hospital: Hospital,
    pickedDriver: User,
    emergencyType: string | null
  ) {
    await this.dbService.db
      .insert(bookings)
      .values({
        patientId: patient.id,
        pickupAddress: pickupAddr,
        pickupLocation: sql`ST_SetSRID(ST_MakePoint(${_patientLng}, ${_patientLat}), 4326)`,

        status: "ASSIGNED",

        providerId: pickedDriver.providerId,
        driverId: pickedDriver.id,
        hospitalId: hospital.id,

        emergencyType: emergencyType,
        fareEstimate: null,

        assignedAt: new Date(),
      })
      .returning();

    if (!pickedDriver.providerId) {
      throw new Error("Driver without provider");
    }

    const provider = await this.dbService.db
      .select()
      .from(ambulanceProviders)
      .where(eq(ambulanceProviders.id, pickedDriver.providerId));

    return { patient, pickedDriver, provider, hospital };
  }

  async updateBooking(bookingId: string, booking: Partial<Booking>) {
    const [updatedBooking] = await this.dbService.db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, bookingId))
      .returning();

    return updatedBooking;
  }

  async getOngoingBookingByUserId(userId: string) {
    const data = await this.dbService.db
      .select({
        id: bookings.id,
        patientId: bookings.patientId,
        driverId: bookings.driverId,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          or(eq(bookings.patientId, userId), eq(bookings.driverId, userId)),
          ne(bookings.status, "COMPLETED")
        )
      );

    if (data.length > 1) {
      console.log("Something is wrong, users cannot have multiple uncompleted bookings");
    }
    return data[0];
  }

  async cancelByPatient(patientId: string, reason: string) {
    const [booking] = await this.dbService.db
      .update(bookings)
      .set({
        status: "CANCELLED",
        cancellationReason: reason,
      })
      .where(and(eq(bookings.patientId, patientId), ne(bookings.status, "COMPLETED")))
      .returning();

    return booking;
  }

  async askDispatchers(nearByDrivers: User[], patient: User) {
    const approvalPromises = nearByDrivers.map(async (driver) => {
      const dispatcherId = await this.dispatcherService.findLiveDispatchersByProvider(
        driver.providerId!
      );

      return this.waitForDispatcherApproval(
        dispatcherId,
        driver,
        patient,
        `req_${Date.now()}_${driver.id}`
      );
    });

    try {
      const winningResponse = await Promise.any(approvalPromises);
      return winningResponse;
    } catch (_error) {
      console.error("All dispatchers rejected the request");
      return null;
    }
  }

  private async waitForDispatcherApproval(
    dispatcherId: string,
    driver: User,
    patient: User,
    requestId: string
  ): Promise<{ dispatcherId: string; pickedDriver: User }> {
    return new Promise((resolve, reject) => {
      this.socketService.dispatcherServer
        ?.to(`dispatcher:${dispatcherId}`)
        .timeout(30000)
        .emit("booking:new", { requestId, driver, patient }, (err: any, response: any) => {
          // response is a array
          if (err || !response[0]?.approved) {
            return reject("Dispatcher declined or ignored");
          }

          resolve({ dispatcherId: dispatcherId, pickedDriver: driver });
        });
    });
  }

  async sendDriverLocation(driverId: string, data: DriverLocationUpdate) {
    const [booking] = await this.dbService.db
      .select({
        patientId: bookings.patientId,
        dispatcherId: bookings.dispatcherId,
      })
      .from(bookings)
      .where(and(eq(bookings.ongoing, true), eq(bookings.driverId, driverId)));
    if (!booking) {
      return;
    }
    const { patientId, dispatcherId } = booking;
    if (!patientId || !dispatcherId) {
      return;
    }
    this.socketService.emitToDispatcher(dispatcherId, "driver:update", data);
    this.socketService.emitToPatient(patientId, "driver:update", data);
  }
}
