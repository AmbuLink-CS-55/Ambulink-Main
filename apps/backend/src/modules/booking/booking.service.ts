import { Injectable } from "@nestjs/common";
import { eq, ne, sql, inArray } from "drizzle-orm";
import { ambulanceProviders, bookings, hospitals, users } from "@/common/database/schema";
import type { Booking, Hospital, User } from "@/common/database/schema";
import { and } from "drizzle-orm";
import { or } from "drizzle-orm";
import { DbService } from "@/common/database/db.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { SocketService } from "@/common/socket/socket.service";
import {
  DriverLocationUpdate,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
} from "@/common/types/socket.types";

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
    emergencyType: string | null,
    dispatcherId?: string | null
  ) {
    const [createdBooking] = await this.dbService.db
      .insert(bookings)
      .values({
        patientId: patient.id,
        pickupAddress: pickupAddr,
        pickupLocation: sql`ST_SetSRID(ST_MakePoint(${_patientLng}, ${_patientLat}), 4326)`,

        status: "ASSIGNED",

        providerId: pickedDriver.providerId,
        driverId: pickedDriver.id,
        hospitalId: hospital.id,
        dispatcherId: dispatcherId ?? null,

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

    return { patient, pickedDriver, provider, hospital, bookingId: createdBooking?.id ?? null };
  }

  async updateBooking(bookingId: string, booking: Partial<Booking>) {
    const updateData: Partial<Booking> = { ...booking };

    if (booking.status === "COMPLETED") {
      updateData.ongoing = false;
      updateData.completedAt = new Date();
    }

    if (booking.status === "CANCELLED") {
      updateData.ongoing = false;
    }

    const [updatedBooking] = await this.dbService.db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();

    if (updatedBooking?.dispatcherId) {
      if (updatedBooking.status === "REQUESTED") {
        return updatedBooking;
      }
      this.socketService.emitToDispatcher(updatedBooking.dispatcherId, "booking:update", {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      } satisfies DispatcherBookingUpdatePayload);
    }

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
    const requests = await Promise.all(
      nearByDrivers.map(async (driver) => {
        const dispatcherId = await this.dispatcherService.findLiveDispatchersByProvider(
          driver.providerId!
        );

        if (!dispatcherId) return null;

        const requestId = `req_${Date.now()}_${driver.id}`;
        return { dispatcherId, driver, requestId };
      })
    );

    const activeRequests = requests.filter(
      (request): request is { dispatcherId: string; driver: User; requestId: string } =>
        Boolean(request)
    );

    if (activeRequests.length === 0) {
      console.error("No available dispatchers for nearby drivers");
      return null;
    }

    const approvalPromises = activeRequests.map(({ dispatcherId, driver, requestId }) =>
      this.waitForDispatcherApproval(dispatcherId, driver, patient, requestId).then(
        (result) => ({ ...result, requestId })
      )
    );

    try {
      const winningResponse = await Promise.any(approvalPromises);
      await this.notifyDispatcherDecision(
        activeRequests.map(({ dispatcherId, requestId }) => ({ dispatcherId, requestId })),
        winningResponse.dispatcherId
      );
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
        .emit(
          "booking:new",
          {
            requestId,
            driver: {
              id: driver.id,
              providerId: driver.providerId,
              currentLocation: driver.currentLocation ?? null,
            },
            patient: {
              id: patient.id,
              fullName: patient.fullName ?? null,
              phoneNumber: patient.phoneNumber ?? null,
              email: patient.email ?? null,
              currentLocation: patient.currentLocation ?? null,
            },
          },
          (err: any, response: any) => {
          // response is a array
          if (err || !response[0]?.approved) {
            return reject("Dispatcher declined or ignored");
          }

          resolve({ dispatcherId: dispatcherId, pickedDriver: driver });
          }
        );
    });
  }

  private async notifyDispatcherDecision(
    dispatcherRequests: { dispatcherId: string; requestId: string }[],
    winnerDispatcherId: string
  ) {
    if (!this.socketService.dispatcherServer) return;

    const [winner] = await this.dbService.db
      .select({
        id: users.id,
        name: users.fullName,
        providerName: ambulanceProviders.name,
      })
      .from(users)
      .leftJoin(ambulanceProviders, eq(users.providerId, ambulanceProviders.id))
      .where(eq(users.id, winnerDispatcherId));

    const winnerPayload = {
      id: winnerDispatcherId,
      name: winner?.name ?? null,
      providerName: winner?.providerName ?? null,
    };

    dispatcherRequests.forEach(({ dispatcherId, requestId }) => {
      this.socketService.dispatcherServer
        ?.to(`dispatcher:${dispatcherId}`)
        .emit("booking:decision", {
          requestId,
          isWinner: dispatcherId === winnerDispatcherId,
          winner: winnerPayload,
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

  async getDispatcherActiveBookings(dispatcherId: string) {
    return this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        pickupLocation: bookings.pickupLocation,
        patientId: users.id,
        patientName: users.fullName,
        patientPhone: users.phoneNumber,
        patientLocation: users.currentLocation,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        driverPhone: sql<string | null>`driver_user.phone_number`,
        driverLocation: sql<any>`driver_user.current_location`,
        providerId: sql<string | null>`${bookings.providerId}`,
        providerName: sql<string | null>`${ambulanceProviders.name}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
        hospitalPhone: hospitals.phoneNumber,
        hospitalLocation: hospitals.location,
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(
        and(
          eq(bookings.dispatcherId, dispatcherId),
          inArray(bookings.status, ["ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
  }

  async buildDispatcherBookingPayload(bookingId: string) {
    const [row] = await this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        pickupLocation: bookings.pickupLocation,
        patientId: users.id,
        patientName: users.fullName,
        patientPhone: users.phoneNumber,
        patientLocation: users.currentLocation,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        driverPhone: sql<string | null>`driver_user.phone_number`,
        driverLocation: sql<any>`driver_user.current_location`,
        providerId: sql<string | null>`${bookings.providerId}`,
        providerName: sql<string | null>`${ambulanceProviders.name}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
        hospitalPhone: hospitals.phoneNumber,
        hospitalLocation: hospitals.location,
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(eq(bookings.id, bookingId));

    if (!row) return null;

    return {
      bookingId: row.bookingId,
      status: row.status === "REQUESTED" ? "ASSIGNED" : row.status,
      pickupLocation: row.pickupLocation ?? null,
      patient: {
        id: row.patientId,
        fullName: row.patientName ?? null,
        phoneNumber: row.patientPhone ?? null,
        location: row.patientLocation ?? null,
      },
      driver: {
        id: row.driverId ?? null,
        fullName: row.driverName ?? null,
        phoneNumber: row.driverPhone ?? null,
        location: row.driverLocation ?? null,
        provider:
          row.providerId && row.providerName
            ? { id: row.providerId, name: row.providerName }
            : null,
      },
      hospital: {
        id: row.hospitalId ?? null,
        name: row.hospitalName ?? null,
        phoneNumber: row.hospitalPhone ?? null,
        location: row.hospitalLocation ?? null,
      },
      provider:
        row.providerId && row.providerName
          ? { id: row.providerId, name: row.providerName }
          : null,
    } satisfies DispatcherBookingPayload;
  }
}
