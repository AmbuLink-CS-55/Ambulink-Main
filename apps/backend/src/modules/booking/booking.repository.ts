import { Injectable } from "@nestjs/common";
import { eq, ne, and, or, sql, inArray, desc } from "drizzle-orm";
import { ambulanceProviders, bookings, hospitals, users } from "@/common/database/schema";
import { DbExecutor, DbService } from "@/common/database/db.service";
import type { Booking, BookingStatus } from "@/common/database/schema";

type CreateBookingValues = {
  patientId: string;
  pickupAddress: string | null;
  pickupLocation: { x: number; y: number };
  providerId: string | null;
  driverId: string;
  hospitalId: string;
  dispatcherId?: string | null;
  emergencyType: string | null;
  fareEstimate?: string | null;
};

@Injectable()
export class BookingRepository {
  constructor(private dbService: DbService) {}

  createBooking(values: CreateBookingValues, db: DbExecutor = this.dbService.db) {
    return db
      .insert(bookings)
      .values({
        patientId: values.patientId,
        pickupAddress: values.pickupAddress,
        pickupLocation: sql`ST_SetSRID(ST_MakePoint(${values.pickupLocation.x}, ${values.pickupLocation.y}), 4326)`,
        status: "ASSIGNED",
        providerId: values.providerId,
        driverId: values.driverId,
        hospitalId: values.hospitalId,
        dispatcherId: values.dispatcherId ?? null,
        emergencyType: values.emergencyType,
        fareEstimate: values.fareEstimate ?? null,
        assignedAt: new Date(),
      })
      .returning();
  }

  updateBooking(bookingId: string, booking: Partial<Booking>, db: DbExecutor = this.dbService.db) {
    return db.update(bookings).set(booking).where(eq(bookings.id, bookingId)).returning();
  }

  getActiveBookingForPatient(patientId: string) {
    return this.dbService.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.patientId, patientId),
          inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
  }

  getOngoingBookingByUserId(userId: string) {
    return this.dbService.db
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
  }

  cancelBookingByPatient(patientId: string, reason: string, db: DbExecutor = this.dbService.db) {
    return db
      .update(bookings)
      .set({
        status: "CANCELLED",
        ongoing: false,
        cancellationReason: reason,
      })
      .where(and(eq(bookings.patientId, patientId), ne(bookings.status, "COMPLETED")))
      .returning();
  }

  getDriverActiveBooking(driverId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.driverId, driverId),
          inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
  }

  getOngoingBookingDispatchInfoForDriver(driverId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select({
        patientId: bookings.patientId,
        dispatcherId: bookings.dispatcherId,
      })
      .from(bookings)
      .where(and(eq(bookings.ongoing, true), eq(bookings.driverId, driverId)));
  }

  getAssignedBookingPayloadRow(bookingId: string) {
    return this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        pickupLocationX: sql<number | null>`ST_X(${bookings.pickupLocation})`,
        pickupLocationY: sql<number | null>`ST_Y(${bookings.pickupLocation})`,
        patientId: users.id,
        patientName: users.fullName,
        patientPhone: users.phoneNumber,
        patientLocationX: sql<number | null>`ST_X(${users.currentLocation})`,
        patientLocationY: sql<number | null>`ST_Y(${users.currentLocation})`,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        driverPhone: sql<string | null>`driver_user.phone_number`,
        driverLocationX: sql<number | null>`ST_X(driver_user.current_location)`,
        driverLocationY: sql<number | null>`ST_Y(driver_user.current_location)`,
        providerId: sql<string | null>`${bookings.providerId}`,
        providerName: sql<string | null>`${ambulanceProviders.name}`,
        providerHotline: sql<string | null>`${ambulanceProviders.hotlineNumber}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
        hospitalPhone: hospitals.phoneNumber,
        hospitalLocationX: sql<number | null>`ST_X(${hospitals.location})`,
        hospitalLocationY: sql<number | null>`ST_Y(${hospitals.location})`,
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(eq(bookings.id, bookingId));
  }

  getDispatcherBookingPayloadRow(bookingId: string) {
    return this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        pickupLocationX: sql<number | null>`ST_X(${bookings.pickupLocation})`,
        pickupLocationY: sql<number | null>`ST_Y(${bookings.pickupLocation})`,
        patientId: users.id,
        patientName: users.fullName,
        patientPhone: users.phoneNumber,
        patientLocationX: sql<number | null>`ST_X(${users.currentLocation})`,
        patientLocationY: sql<number | null>`ST_Y(${users.currentLocation})`,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        driverPhone: sql<string | null>`driver_user.phone_number`,
        driverLocationX: sql<number | null>`ST_X(driver_user.current_location)`,
        driverLocationY: sql<number | null>`ST_Y(driver_user.current_location)`,
        providerId: sql<string | null>`${bookings.providerId}`,
        providerName: sql<string | null>`${ambulanceProviders.name}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
        hospitalPhone: hospitals.phoneNumber,
        hospitalLocationX: sql<number | null>`ST_X(${hospitals.location})`,
        hospitalLocationY: sql<number | null>`ST_Y(${hospitals.location})`,
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(eq(bookings.id, bookingId));
  }

  getDispatcherActiveBookingRows(dispatcherId: string) {
    return this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        pickupLocationX: sql<number | null>`ST_X(${bookings.pickupLocation})`,
        pickupLocationY: sql<number | null>`ST_Y(${bookings.pickupLocation})`,
        patientId: users.id,
        patientName: users.fullName,
        patientPhone: users.phoneNumber,
        patientLocationX: sql<number | null>`ST_X(${users.currentLocation})`,
        patientLocationY: sql<number | null>`ST_Y(${users.currentLocation})`,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        driverPhone: sql<string | null>`driver_user.phone_number`,
        driverLocationX: sql<number | null>`ST_X(driver_user.current_location)`,
        driverLocationY: sql<number | null>`ST_Y(driver_user.current_location)`,
        providerId: sql<string | null>`${bookings.providerId}`,
        providerName: sql<string | null>`${ambulanceProviders.name}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
        hospitalPhone: hospitals.phoneNumber,
        hospitalLocationX: sql<number | null>`ST_X(${hospitals.location})`,
        hospitalLocationY: sql<number | null>`ST_Y(${hospitals.location})`,
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

  getBookingLogRows(providerId?: string, status?: string) {
    const conditions = [] as Array<ReturnType<typeof eq>>;

    if (providerId) {
      conditions.push(eq(bookings.providerId, providerId));
    }

    if (status) {
      conditions.push(eq(bookings.status, status as BookingStatus));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const baseQuery = this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        requestedAt: bookings.requestedAt,
        assignedAt: bookings.assignedAt,
        arrivedAt: bookings.arrivedAt,
        pickedupAt: bookings.pickedupAt,
        completedAt: bookings.completedAt,
        fareEstimate: bookings.fareEstimate,
        fareFinal: bookings.fareFinal,
        cancellationReason: bookings.cancellationReason,
        patientId: users.id,
        patientName: users.fullName,
        patientPhone: users.phoneNumber,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        driverPhone: sql<string | null>`driver_user.phone_number`,
        ambulanceId: bookings.ambulanceId,
        providerId: sql<string | null>`${bookings.providerId}`,
        providerName: sql<string | null>`${ambulanceProviders.name}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId));

    const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

    return filteredQuery.orderBy(desc(bookings.requestedAt));
  }
}
