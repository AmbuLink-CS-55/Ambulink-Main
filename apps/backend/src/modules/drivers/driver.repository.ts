import { Injectable } from "@nestjs/common";
import { eq, and, sql, isNotNull, asc, or } from "drizzle-orm";
import { users, bookings } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import type { NewUser, UserStatus } from "@/common/database/schema";

@Injectable()
export class DriverRepository {
  constructor(private dbService: DbService) {}

  createDriver(driver: Omit<NewUser, "role">) {
    return this.dbService.db
      .insert(users)
      .values({
        fullName: driver.fullName,
        phoneNumber: driver.phoneNumber,
        email: driver.email,
        passwordHash: driver.passwordHash,
        role: "DRIVER",
        providerId: driver.providerId as string | null,
      })
      .returning();
  }

  findAllDrivers(providerId?: string, isActive?: boolean, status?: UserStatus) {
    const conditions = [eq(users.role, "DRIVER" as const)];

    if (providerId) {
      conditions.push(eq(users.providerId, providerId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    if (status) {
      conditions.push(eq(users.status, status));
    }

    return this.dbService.db
      .select()
      .from(users)
      .where(and(...conditions));
  }

  findDriverById(id: string) {
    return this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DRIVER" as const)));
  }

  updateDriver(id: string, driver: Partial<NewUser>) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (driver.fullName !== undefined) updateData.fullName = driver.fullName;
    if (driver.phoneNumber !== undefined) updateData.phoneNumber = driver.phoneNumber;
    if (driver.email !== undefined) updateData.email = driver.email;
    if (driver.passwordHash !== undefined) updateData.passwordHash = driver.passwordHash;
    if (driver.providerId !== undefined) updateData.providerId = driver.providerId as string | null;

    return this.dbService.db.update(users).set(updateData).where(eq(users.id, id)).returning();
  }

  removeDriver(id: string) {
    return this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  setDriverStatus(driverId: string, status: UserStatus) {
    return this.dbService.db
      .update(users)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")))
      .returning();
  }

  checkDriverAvailability(driverId: string) {
    return this.dbService.db
      .select({ status: users.status })
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  removeDriverStatus(driverId: string) {
    return this.dbService.db
      .update(users)
      .set({
        status: null,
        updatedAt: new Date(),
      })
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
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  clearDriverLocation(driverId: string) {
    return this.dbService.db
      .update(users)
      .set({
        currentLocation: null,
        lastLocationUpdate: null,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
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
          isNotNull(users.currentLocation),
          isNotNull(users.lastLocationUpdate),
          sql`${users.lastLocationUpdate} > NOW() - INTERVAL '60 seconds'`
        )
      )
      .orderBy(asc(distanceExpr))
      .limit(3);
  }

  findNearbyDriversForMap(lat: number, lng: number, limit: number) {
    const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
    const distanceExpr = sql<number>`ST_DistanceSphere(${users.currentLocation}, ${point})`;

    return this.dbService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        phoneNumber: users.phoneNumber,
        providerId: users.providerId,
        status: users.status,
        locationX: sql<number | null>`ST_X(${users.currentLocation})`,
        locationY: sql<number | null>`ST_Y(${users.currentLocation})`,
        distanceMeters: distanceExpr,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "DRIVER"),
          eq(users.isActive, true),
          eq(users.status, "AVAILABLE"),
          isNotNull(users.currentLocation),
          isNotNull(users.lastLocationUpdate),
          sql`${users.lastLocationUpdate} > NOW() - INTERVAL '60 seconds'`
        )
      )
      .orderBy(asc(distanceExpr))
      .limit(limit);
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
