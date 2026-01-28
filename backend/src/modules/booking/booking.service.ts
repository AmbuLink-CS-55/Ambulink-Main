import { Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DbService } from "@/services/db.service";
import { bookings } from "@/database/schema";

@Injectable()
export class BookingService {
  constructor(private db: DbService) { }

  async createBooking(
    patient: any,
    patientLat: number,
    patientLng: number,
    pickupAddr: string | null,
    hospital: any,
    pickedDriver: any,
    emergencyType: string | null
  ) {
    const [newBooking] = await this.db
      .getDb()
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

  setArrived(bookingId: string) {
    this.db
      .getDb()
      .update(bookings)
      .set({
        status: "ARRIVED",
        arrivedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
  }

  setCompleted(bookingId: string) {
    this.db
      .getDb()
      .update(bookings)
      .set({
        status: "COMPLETED",
        arrivedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
  }
}
