import { Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { bookings, hospitals } from "@/core/database/schema";
import type { BookingStatus } from "@/core/database/schema";
import { DbService } from "@/core/database/db.service";

export type AnalyticsBookingRow = {
  bookingId: string;
  status: BookingStatus;
  requestedAt: Date | null;
  assignedAt: Date | null;
  arrivedAt: Date | null;
  pickedupAt: Date | null;
  completedAt: Date | null;
  cancellationReason: string | null;
  driverId: string | null;
  driverName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
  pickupLocationX: number | null;
  pickupLocationY: number | null;
  hospitalLocationX: number | null;
  hospitalLocationY: number | null;
};

@Injectable()
export class AnalyticsRepository {
  constructor(private dbService: DbService) {}

  getAnalyticsRows(providerId: string, range?: { from?: Date; to?: Date }) {
    const filters = [eq(bookings.providerId, providerId)];

    if (range?.from) {
      filters.push(sql`${bookings.requestedAt} >= ${range.from}`);
    }

    if (range?.to) {
      filters.push(sql`${bookings.requestedAt} <= ${range.to}`);
    }

    return this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        requestedAt: bookings.requestedAt,
        assignedAt: bookings.assignedAt,
        arrivedAt: bookings.arrivedAt,
        pickedupAt: bookings.pickedupAt,
        completedAt: bookings.completedAt,
        cancellationReason: bookings.cancellationReason,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        hospitalId: sql<string | null>`${bookings.hospitalId}`,
        hospitalName: sql<string | null>`${hospitals.name}`,
        pickupLocationX: sql<number | null>`ST_X(${bookings.pickupLocation})`,
        pickupLocationY: sql<number | null>`ST_Y(${bookings.pickupLocation})`,
        hospitalLocationX: sql<number | null>`ST_X(${hospitals.location})`,
        hospitalLocationY: sql<number | null>`ST_Y(${hospitals.location})`,
      })
      .from(bookings)
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(and(...filters));
  }

  getBookingAnalyticsRow(providerId: string, bookingId: string) {
    return this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        requestedAt: bookings.requestedAt,
        assignedAt: bookings.assignedAt,
        arrivedAt: bookings.arrivedAt,
        pickedupAt: bookings.pickedupAt,
        completedAt: bookings.completedAt,
        cancellationReason: bookings.cancellationReason,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        hospitalId: sql<string | null>`${bookings.hospitalId}`,
        hospitalName: sql<string | null>`${hospitals.name}`,
        pickupLocationX: sql<number | null>`ST_X(${bookings.pickupLocation})`,
        pickupLocationY: sql<number | null>`ST_Y(${bookings.pickupLocation})`,
        hospitalLocationX: sql<number | null>`ST_X(${hospitals.location})`,
        hospitalLocationY: sql<number | null>`ST_Y(${hospitals.location})`,
      })
      .from(bookings)
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(and(eq(bookings.providerId, providerId), eq(bookings.id, bookingId)));
  }
}
