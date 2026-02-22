import { eq, ne, and, or, sql, inArray, desc } from "drizzle-orm";
import { ambulanceProviders, bookings, hospitals, users } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";
import type { Booking, BookingStatus } from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const createBooking = (
  db: Db,
  values: {
    patientId: string;
    pickupAddress: string | null;
    pickupLocation: { x: number; y: number };
    providerId: string | null;
    driverId: string;
    hospitalId: string;
    dispatcherId?: string | null;
    emergencyType: string | null;
    fareEstimate?: string | null;
  }
) =>
  db
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

export const updateBooking = (db: Db, bookingId: string, booking: Partial<Booking>) =>
  db.update(bookings).set(booking).where(eq(bookings.id, bookingId)).returning();

export const getActiveBookingForPatient = (db: Db, patientId: string) =>
  db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.patientId, patientId),
        inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
      )
    );

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
        inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
      )
    );

export const getOngoingBookingDispatchInfoForDriver = (db: Db, driverId: string) =>
  db
    .select({
      patientId: bookings.patientId,
      dispatcherId: bookings.dispatcherId,
    })
    .from(bookings)
    .where(and(eq(bookings.ongoing, true), eq(bookings.driverId, driverId)));

export const getAssignedBookingPayloadRow = (db: Db, bookingId: string) =>
  db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
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

export const getDispatcherBookingPayloadRow = (db: Db, bookingId: string) =>
  db
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

export const getDispatcherActiveBookingRows = (db: Db, dispatcherId: string) =>
  db
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

export const getBookingLogRows = (db: Db, providerId?: string, status?: string) => {
  const conditions = [] as Array<ReturnType<typeof eq>>;

  if (providerId) {
    conditions.push(eq(bookings.providerId, providerId));
  }

  if (status) {
    conditions.push(eq(bookings.status, status as BookingStatus));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const baseQuery = db
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
};

export const getDispatcherWinnerInfo = (db: Db, winnerDispatcherId: string) =>
  db
    .select({
      id: users.id,
      name: users.fullName,
      providerName: ambulanceProviders.name,
    })
    .from(users)
    .leftJoin(ambulanceProviders, eq(users.providerId, ambulanceProviders.id))
    .where(eq(users.id, winnerDispatcherId));

export type CreateBookingResult = Awaited<ReturnType<typeof createBooking>>;
export type UpdateBookingResult = Awaited<ReturnType<typeof updateBooking>>;
export type GetActiveBookingForPatientResult = Awaited<
  ReturnType<typeof getActiveBookingForPatient>
>;
export type GetOngoingBookingByUserIdResult = Awaited<ReturnType<typeof getOngoingBookingByUserId>>;
export type CancelBookingByPatientResult = Awaited<ReturnType<typeof cancelBookingByPatient>>;
export type GetDriverActiveBookingResult = Awaited<ReturnType<typeof getDriverActiveBooking>>;
export type GetOngoingBookingDispatchInfoForDriverResult = Awaited<
  ReturnType<typeof getOngoingBookingDispatchInfoForDriver>
>;
export type GetAssignedBookingPayloadRowResult = Awaited<
  ReturnType<typeof getAssignedBookingPayloadRow>
>;
export type GetDispatcherBookingPayloadRowResult = Awaited<
  ReturnType<typeof getDispatcherBookingPayloadRow>
>;
export type GetDispatcherActiveBookingRowsResult = Awaited<
  ReturnType<typeof getDispatcherActiveBookingRows>
>;
export type GetBookingLogRowsResult = Awaited<ReturnType<typeof getBookingLogRows>>;
export type GetDispatcherWinnerInfoResult = Awaited<ReturnType<typeof getDispatcherWinnerInfo>>;
