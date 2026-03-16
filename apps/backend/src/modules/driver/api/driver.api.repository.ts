import { Inject, Injectable } from "@nestjs/common";
import { eq, and, sql, isNotNull, asc } from "drizzle-orm";
import { users } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { KV_STORE, type KvStore } from "@/core/database/kv-store.types";
import type { NewUser, UserStatus } from "@/core/database/schema";

@Injectable()
export class DriverApiRepository {
  constructor(
    private dbService: DbService,
    @Inject(KV_STORE) private kvStore: KvStore
  ) {}

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
      .returning(this.safeUserColumns);
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
      .select(this.safeUserColumns)
      .from(users)
      .where(and(...conditions))
      .then((rows) => this.kvStore.applyDriverOverlay(rows));
  }

  async findDriverById(id: string, db: DbExecutor = this.dbService.db) {
    const rows = await db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DRIVER" as const)));
    return this.kvStore.applyDriverOverlay(rows);
  }

  async updateDriver(id: string, driver: Partial<NewUser>) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (driver.fullName !== undefined) updateData.fullName = driver.fullName;
    if (driver.phoneNumber !== undefined) updateData.phoneNumber = driver.phoneNumber;
    if (driver.email !== undefined) updateData.email = driver.email;
    if (driver.passwordHash !== undefined) updateData.passwordHash = driver.passwordHash;
    if (driver.providerId !== undefined) updateData.providerId = driver.providerId as string | null;

    const rows = await this.dbService.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning(this.safeUserColumns);

    return this.kvStore.applyDriverOverlay(rows);
  }

  removeDriver(id: string) {
    return this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async findNearbyDriversForMap(lat: number, lng: number, limit: number) {
    const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
    const distanceExpr = sql<number>`ST_DistanceSphere(${users.currentLocation}, ${point})`;

    const rows = await this.dbService.db
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
          isNotNull(users.currentLocation)
        )
      )
      .orderBy(asc(distanceExpr))
      .limit(limit);

    const overlaid = await this.kvStore.applyDriverOverlay(rows);
    return overlaid.map((row) => {
      const currentLocation = (row as { currentLocation?: { x: number; y: number } | null })
        .currentLocation;
      if (currentLocation !== undefined) {
        return {
          ...row,
          locationX: currentLocation?.x ?? null,
          locationY: currentLocation?.y ?? null,
        };
      }
      return row;
    });
  }

}
