import { eq, and, sql, isNotNull, asc } from "drizzle-orm";
import { users } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";
import type { NewUser, UserStatus } from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const createDriver = (db: Db, driver: NewUser) =>
  db
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

export const findAllDrivers = (db: Db, providerId?: string, isActive?: boolean) => {
  const conditions = [eq(users.role, "DRIVER" as const)];

  if (providerId) {
    conditions.push(eq(users.providerId, providerId));
  }

  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive));
  }

  return db.select().from(users).where(and(...conditions));
};

export const findDriverById = (db: Db, id: string) =>
  db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "DRIVER" as const)));

export const updateDriver = (db: Db, id: string, driver: Partial<NewUser>) => {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (driver.fullName !== undefined) updateData.fullName = driver.fullName;
  if (driver.phoneNumber !== undefined) updateData.phoneNumber = driver.phoneNumber;
  if (driver.email !== undefined) updateData.email = driver.email;
  if (driver.passwordHash !== undefined) updateData.passwordHash = driver.passwordHash;
  if (driver.providerId !== undefined) updateData.providerId = driver.providerId as string | null;

  return db.update(users).set(updateData).where(eq(users.id, id)).returning();
};

export const removeDriver = (db: Db, id: string) =>
  db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id));

export const setDriverStatus = (db: Db, driverId: string, status: UserStatus) =>
  db
    .update(users)
    .set({
      status: status,
      updatedAt: new Date(),
    })
    .where(eq(users.id, driverId));

export const checkDriverAvailability = (db: Db, driverId: string) =>
  db
    .select({ status: users.status })
    .from(users)
    .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));

export const removeDriverStatus = (db: Db, driverId: string) =>
  db
    .update(users)
    .set({
      status: null,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));

export const setDriverLocation = (db: Db, driverId: string, lat: number, lng: number) => {
  const pointWkt = `POINT(${lng} ${lat})`;
  return db
    .update(users)
    .set({
      currentLocation: sql`ST_GeomFromText(${pointWkt}, 4326)`,
      lastLocationUpdate: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
};

export const findDriversByLocation = (db: Db, lat: number, lng: number) => {
  const distanceExpr = sql<number>`ST_Distance(
    ${users.currentLocation}::geography,
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
  )`;

  return db
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
};

export type CreateDriverResult = Awaited<ReturnType<typeof createDriver>>;
export type FindAllDriversResult = Awaited<ReturnType<typeof findAllDrivers>>;
export type FindDriverByIdResult = Awaited<ReturnType<typeof findDriverById>>;
export type UpdateDriverResult = Awaited<ReturnType<typeof updateDriver>>;
export type FindDriversByLocationResult = Awaited<ReturnType<typeof findDriversByLocation>>;
