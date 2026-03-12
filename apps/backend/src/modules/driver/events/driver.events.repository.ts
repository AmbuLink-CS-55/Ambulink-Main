import { Injectable } from "@nestjs/common";
import { eq, and, sql, isNotNull, asc, or } from "drizzle-orm";
import { users, bookings } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import type { UserStatus } from "@/core/database/schema";

@Injectable()
export class DriverEventsRepository {
  constructor(private dbService: DbService) {}

  private readonly safeUserColumns = {
    id: users.id,
    fullName: users.fullName,
    phoneNumber: users.phoneNumber,
    email: users.email,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    isActive: users.isActive,
    lastLoginAt: users.lastLoginAt,
    role: users.role,
    providerId: users.providerId,
    currentLocation: users.currentLocation,
    lastLocationUpdate: users.lastLocationUpdate,
    status: users.status,
    subscribedBookingId: users.subscribedBookingId,
  };

  findDriverById(id: string, db: DbExecutor = this.dbService.db) {
    return db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DRIVER" as const)));
  }

  setDriverStatus(driverId: string, status: UserStatus, db: DbExecutor = this.dbService.db) {
    return db
      .update(users)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")))
      .returning(this.safeUserColumns);
  }

  checkDriverAvailability(driverId: string) {
    return this.dbService.db
      .select({ status: users.status })
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  setDriverLocation(driverId: string, lat: number, lng: number) {
    const pointWkt = `POINT(${lng} ${lat})`;
    return this.dbService.db
      .update(users)
      .set({
        currentLocation: sql`ST_GeomFromText(${pointWkt}, 4326)`,
        lastLocationUpdate: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")))
      .returning({ id: users.id });
  }

  clearDriverLocation(driverId: string) {
    return this.dbService.db
      .update(users)
      .set({
        currentLocation: null,
        lastLocationUpdate: null,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")))
      .returning({ id: users.id });
  }

  findDriversByLocation(lat: number, lng: number) {
    const distanceExpr = sql<number>`ST_Distance(
    ${users.currentLocation}::geography,
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
  )`;

    return this.dbService.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "DRIVER"),
          eq(users.isActive, true),
          eq(users.status, "AVAILABLE"),
          isNotNull(users.currentLocation)
        )
      )
      .orderBy(asc(distanceExpr))
      .limit(3);
  }

  getDriverBooking(driverId: string) {
    return this.dbService.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.driverId, driverId),
          or(eq(bookings.status, "ASSIGNED"), eq(bookings.status, "ARRIVED"))
        )
      );
  }
}
