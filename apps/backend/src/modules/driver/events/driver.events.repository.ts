import { Inject, Injectable } from "@nestjs/common";
import { eq, and, sql, isNotNull, asc, or } from "drizzle-orm";
import { users, bookings } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { KV_STORE, type KvStore } from "@/core/database/kv-store.types";
import type { UserStatus } from "@/core/database/schema";

@Injectable()
export class DriverEventsRepository {
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

  async findDriverById(id: string, db: DbExecutor = this.dbService.db) {
    const rows = await db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DRIVER" as const)));
    return this.kvStore.applyDriverOverlay(rows);
  }

  async setDriverStatus(driverId: string, status: UserStatus, db: DbExecutor = this.dbService.db) {
    const now = new Date();
    await this.kvStore.setDriverState(driverId, {
      status,
      updatedAt: now,
    });

    const rows = await db
      .select(this.safeUserColumns)
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));

    return this.kvStore.applyDriverOverlay(rows);
  }

  async checkDriverAvailability(driverId: string) {
    const rows = await this.dbService.db
      .select({ status: users.status })
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
    const state = await this.kvStore.getDriverState(driverId);
    if (state?.status !== undefined && rows[0]) {
      rows[0] = { ...rows[0], status: state.status };
    }
    return rows;
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    const now = new Date();
    await this.kvStore.setDriverState(driverId, {
      location: { x: lng, y: lat },
      lastLocationUpdate: now,
      updatedAt: now,
    });

    return this.dbService.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  async clearDriverLocation(driverId: string) {
    await this.kvStore.setDriverState(driverId, {
      location: null,
      lastLocationUpdate: null,
      updatedAt: new Date(),
    });

    return this.dbService.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  async findDriversByLocation(lat: number, lng: number) {
    const distanceExpr = sql<number>`ST_Distance(
    ${users.currentLocation}::geography,
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
  )`;

    const rows = await this.dbService.db
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

    return this.kvStore.applyDriverOverlay(rows);
  }

  async getDriverBooking(driverId: string) {
    const kvRows = await this.kvStore.getNewActiveBookingsByDriver(driverId);
    if (kvRows.length > 0) {
      return kvRows;
    }

    const rows = await this.dbService.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.driverId, driverId),
          or(eq(bookings.status, "ASSIGNED"), eq(bookings.status, "ARRIVED"))
        )
      );

    return this.kvStore.applyBookingOverlay(rows);
  }
}
