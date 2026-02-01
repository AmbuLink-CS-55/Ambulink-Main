import { Injectable } from "@nestjs/common";
import { eq, mapColumnsInAliasedSQLToAlias, ne, SQL, sql } from "drizzle-orm";
import { bookings, users } from "@/common/database/schema";
import { SelectPatientDto } from "@/common/dto/patient.schema";
import { and } from "drizzle-orm";
import { InsertBookingDto } from "@/common/dto/bookings.schema";
import { or } from "drizzle-orm";
import { DbService } from "@/common/database/db.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { SocketService } from "@/common/socket/socket.service";
import { NearByDriver } from "@/common/types";
import { AwsPgDialect } from "drizzle-orm/aws-data-api/pg";

@Injectable()
export class BookingService {
  constructor(
    private dbService: DbService,
    private dispatcherService: DispatcherService,
    private socketService: SocketService
  ) { }

  async createBooking(
    patient: SelectPatientDto,
    patientLat: number,
    patientLng: number,
    pickupAddr: string | null,
    hospital: any,
    pickedDriver: any,
    emergencyType: string | null
  ) {
    const [newBooking] = await this.dbService.db
      .insert(bookings)
      .values({
        patientId: patient.id,
        pickupAddress: pickupAddr,
        pickupLocation: sql`ST_SetSRID(ST_MakePoint(${pickedDriver.lng}, ${pickedDriver.lat}), 4326)`,

        status: "ASSIGNED",

        providerId: pickedDriver.ambulance_provider.id,
        driverId: pickedDriver.id,
        hospitalId: hospital.id,

        emergencyType: emergencyType,
        fareEstimate: pickedDriver.distance.toString(),

        assignedAt: new Date(),
      })
      .returning();

    return {
      id: newBooking.id,
      patient: {
        id: patient.id,
        phone_number: patient.phoneNumber ?? "",
        name: patient.fullName ?? "",
        lat: patientLat,
        lng: patientLng,
      },
      driver: {
        id: pickedDriver.id,
        phone_number: pickedDriver.phoneNumber ?? "",
        lat: pickedDriver.lat,
        lng: pickedDriver.lng,
        ambulance_provider: {
          id: pickedDriver.ambulance_provider.id,
          name: pickedDriver.ambulance_provider.name,
        },
      },
      hospital: {
        id: hospital.id,
        name: hospital.name,
        phone_number: hospital.phoneNumber ?? "",
        lat: hospital.location?.y ?? 0,
        lng: hospital.location?.x ?? 0,
      },
    };
  }

  updateBooking(bookingId: string, booking: Partial<InsertBookingDto>) {
    this.dbService.db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, bookingId));
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
      console.log(
        "Something is wrong, users cannot have multiple uncompleted bookings"
      );
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
      .where(
        and(eq(bookings.patientId, patientId), ne(bookings.status, "COMPLETED"))
      )
      .returning();

    return booking;
  }

  async askDispatchers(nearByDrivers: NearByDriver[], patient: SelectPatientDto) {
    const approvalPromises = nearByDrivers.map(async (driver) => {
      const dispatcherId = await this.dispatcherService.findLiveDispatchersByProvider(
        driver.ambulance_provider.id
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
    } catch (error) {
      console.error("All dispatchers rejected the request");
      return null;
    }
  }

  private async waitForDispatcherApproval(
    dispatcherId: string,
    driver: NearByDriver,
    patient: SelectPatientDto,
    requestId: string
  ): Promise<{ dispatcherId: string, pickedDriver: NearByDriver }> {
    return new Promise((resolve, reject) => {
      this.socketService.dispatcherServer
        ?.to(`dispatcher:${dispatcherId}`)
        .timeout(30000)
        .emit("booking:new", { requestId, driver, patient }, (err: any, response: any) => {
          // response is a array
          if (err || !response[0]?.approved) {
            return reject("Dispatcher declined or ignored");
          }


          resolve({ dispatcherId: dispatcherId, pickedDriver: driver })
        });
    });
  }

}
