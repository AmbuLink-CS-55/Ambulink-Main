import { eq, ne, and, or, sql } from "drizzle-orm";
import { bookings } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";
import type { Booking } from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const createBooking = (
  db: Db,
  values: {
    patientId: string;
    pickupAddress: string | null;
    pickupLocation: { x: number; y: number };
    providerId: string;
    driverId: string;
    hospitalId: string;
    emergencyType: string | null;
    fareEstimate?: string | null;
  }
) =>
  db.insert(bookings).values({
    patientId: values.patientId,
    pickupAddress: values.pickupAddress,
    pickupLocation: sql`ST_SetSRID(ST_MakePoint(${values.pickupLocation.x}, ${values.pickupLocation.y}), 4326)`,
    status: "ASSIGNED",
    providerId: values.providerId,
    driverId: values.driverId,
    hospitalId: values.hospitalId,
    emergencyType: values.emergencyType,
    fareEstimate: values.fareEstimate ?? null,
    assignedAt: new Date(),
  });

export const updateBooking = (db: Db, bookingId: string, booking: Partial<Booking>) =>
  db.update(bookings).set(booking).where(eq(bookings.id, bookingId)).returning();

export const getOngoingBookingByUserId = (db: Db, userId: string) =>
  db
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

export const cancelBookingByPatient = (db: Db, patientId: string, reason: string) =>
  db
    .update(bookings)
    .set({
      status: "CANCELLED",
      cancellationReason: reason,
    })
    .where(and(eq(bookings.patientId, patientId), ne(bookings.status, "COMPLETED")))
    .returning();

export const getDriverActiveBooking = (db: Db, driverId: string) =>
  db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.driverId, driverId),
        or(eq(bookings.status, "ASSIGNED"), eq(bookings.status, "ARRIVED"))
      )
    );

export type CreateBookingResult = Awaited<ReturnType<typeof createBooking>>;
export type UpdateBookingResult = Awaited<ReturnType<typeof updateBooking>>;
export type GetOngoingBookingByUserIdResult = Awaited<ReturnType<typeof getOngoingBookingByUserId>>;
export type CancelBookingByPatientResult = Awaited<ReturnType<typeof cancelBookingByPatient>>;
export type GetDriverActiveBookingResult = Awaited<ReturnType<typeof getDriverActiveBooking>>;
