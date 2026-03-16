import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import env from "env";
import { and, eq, sql } from "drizzle-orm";
import { createClient, type RedisClientType } from "redis";
import { users, type Booking, type BookingStatus } from "@/core/database/schema";
import type { BookingNote } from "@ambulink/types";
import { DbService } from "./db.service";
import { sanitizeBookingPatch, type BookingState, type CreateBookingValues, type DriverState, type KvStore } from "./kv-store.types";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"];
const BOOKING_DATE_FIELDS = ["requestedAt", "assignedAt", "arrivedAt", "pickedupAt", "completedAt"] as const;
const BOOKING_STATE_TTL_SECONDS = 30 * 60;
const BOOKING_INDEX_TTL_SECONDS = 30 * 60;
const SUBSCRIPTION_TTL_SECONDS = 10 * 60;

@Injectable()
export class RedisKvStoreService implements KvStore {
  private readonly logger = new Logger(RedisKvStoreService.name);
  private redisClient: RedisClientType | null = null;
  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(private dbService: DbService) {}

  async ping() {
    await this.ensureRedisClient();
    const pong = await this.redisClient?.ping();
    return pong === "PONG";
  }

  async initialize() {
    await this.ensureRedisClient();
    this.flushInterval = setInterval(() => {
      void this.flushToPostgres();
    }, 10 * 60 * 1000);

    this.logger.log({ event: "kv_store_redis_initialized" });
  }

  async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flushToPostgres();

    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }

  async createBooking(values: CreateBookingValues): Promise<Booking> {
    const now = new Date();
    const id = randomUUID();

    const data: Partial<Booking> & { id: string } = {
      id,
      patientId: values.patientId,
      status: "ASSIGNED",
      ongoing: true,
      driverId: values.driverId,
      dispatcherId: values.dispatcherId ?? null,
      assignedAt: now,
      requestedAt: now,
    } as Partial<Booking> & { id: string };

    const state: BookingState = {
      id,
      isNew: true,
      dirty: true,
      data,
    };

    await this.saveBookingState(state, null);
    return data as Booking;
  }

  async updateBooking(bookingId: string, patch: Partial<Booking>) {
    const previous = await this.getBookingState(bookingId);

    const sanitizedPatch = sanitizeBookingPatch(patch);
    const next: BookingState = previous
      ? {
          ...previous,
          dirty: false,
          data: {
            ...previous.data,
            ...sanitizedPatch,
          },
        }
      : {
          id: bookingId,
          isNew: false,
          dirty: false,
          data: {
            id: bookingId,
            ...sanitizedPatch,
          },
        };

    await this.saveBookingState(next, previous ?? null);
  }

  async appendBookingNote(bookingId: string, note: BookingNote) {
    const state = await this.getBookingState(bookingId);
    const baseNotes = Array.isArray(state?.data.emtNotes) ? state.data.emtNotes : [];
    await this.updateBooking(bookingId, { emtNotes: [...baseNotes, note] });
  }

  async getBookingState(bookingId: string): Promise<BookingState | undefined> {
    await this.ensureRedisClient();
    const raw = await this.redisClient?.get(this.bookingKey(bookingId));
    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as BookingState;
    return {
      ...parsed,
      data: this.hydrateBookingDates(parsed.data),
    };
  }

  async getBookingData(bookingId: string) {
    const state = await this.getBookingState(bookingId);
    return state?.data;
  }

  async getActiveBookingByIdFromMemory(bookingId: string) {
    const state = await this.getBookingState(bookingId);
    if (!state?.data.status || !ACTIVE_BOOKING_STATUSES.includes(state.data.status)) {
      return null;
    }

    return state.data;
  }

  async getNewActiveBookingsByPatient(patientId: string) {
    return this.getIndexedBookingData(this.patientActiveIndexKey(patientId));
  }

  async getNewActiveBookingsByDriver(driverId: string) {
    return this.getIndexedBookingData(this.driverActiveIndexKey(driverId));
  }

  async getNewActiveBookingsByDispatcher(dispatcherId: string) {
    return this.getIndexedBookingData(this.dispatcherActiveIndexKey(dispatcherId));
  }

  async getNewOngoingDispatchBookingByDriver(driverId: string) {
    await this.ensureRedisClient();
    const bookingIds = await this.redisClient?.sMembers(this.driverOngoingIndexKey(driverId));
    const firstBookingId = bookingIds?.[0];
    if (!firstBookingId) return null;

    const booking = await this.getBookingData(firstBookingId);
    if (!booking) return null;

    return {
      bookingId: firstBookingId,
      patientId: booking.patientId ?? null,
      dispatcherId: booking.dispatcherId ?? null,
    };
  }

  async applyBookingOverlay<T extends Record<string, any>>(rows: T[]): Promise<T[]> {
    const uniqueBookingIds = [...new Set(rows.map((row) => (row.id ?? row.bookingId) as string | undefined).filter(Boolean))] as string[];

    const bookingMap = new Map<string, Partial<Booking> & { id: string }>();
    for (const bookingId of uniqueBookingIds) {
      const data = await this.getBookingData(bookingId);
      if (data) bookingMap.set(bookingId, data);
    }

    return rows
      .map((row) => {
        const bookingId = (row.id ?? row.bookingId) as string | undefined;
        if (!bookingId) return row;

        const data = bookingMap.get(bookingId);
        if (!data) return row;

        return {
          ...row,
          ...data,
        } as T;
      })
      .filter((row) => {
        const status = (row as { status?: BookingStatus }).status;
        if (!status) return true;
        return ACTIVE_BOOKING_STATUSES.includes(status);
      }) as T[];
  }

  async setDriverState(driverId: string, patch: Omit<DriverState, "dirty">) {
    const existing = await this.getDriverState(driverId);
    const next: DriverState = {
      ...(existing ?? { dirty: true }),
      ...patch,
      dirty: true,
    };

    await this.ensureRedisClient();
    await this.redisClient?.set(this.driverKey(driverId), JSON.stringify(next));
    await this.redisClient?.sAdd(this.driverDirtySetKey(), driverId);
  }

  async getDriverState(driverId: string): Promise<DriverState | undefined> {
    await this.ensureRedisClient();
    const raw = await this.redisClient?.get(this.driverKey(driverId));
    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as DriverState & {
      lastLocationUpdate?: string | null;
      updatedAt?: string;
    };

    return {
      ...parsed,
      lastLocationUpdate:
        typeof parsed.lastLocationUpdate === "string"
          ? new Date(parsed.lastLocationUpdate)
          : parsed.lastLocationUpdate ?? null,
      updatedAt: typeof parsed.updatedAt === "string" ? new Date(parsed.updatedAt) : undefined,
    };
  }

  async applyDriverOverlay<T extends Record<string, any>>(rows: T[]): Promise<T[]> {
    const uniqueDriverIds = [...new Set(rows.map((row) => row.id as string | undefined).filter(Boolean))] as string[];

    const driverMap = new Map<string, DriverState>();
    for (const driverId of uniqueDriverIds) {
      const state = await this.getDriverState(driverId);
      if (state) driverMap.set(driverId, state);
    }

    return rows.map((row) => {
      const driverId = row.id as string | undefined;
      if (!driverId) return row;

      const state = driverMap.get(driverId);
      if (!state) return row;

      return {
        ...row,
        ...(state.status !== undefined ? { status: state.status } : {}),
        ...(state.location !== undefined ? { currentLocation: state.location } : {}),
        ...(state.lastLocationUpdate !== undefined
          ? { lastLocationUpdate: state.lastLocationUpdate }
          : {}),
        ...(state.updatedAt !== undefined ? { updatedAt: state.updatedAt } : {}),
      } as T;
    });
  }

  async setUserSubscribedBooking(userId: string, bookingId: string | null) {
    await this.ensureRedisClient();

    const previous = await this.getSubscriptionRecord(userId);
    if (previous?.bookingId) {
      await this.redisClient?.sRem(this.bookingSubscribersKey(previous.bookingId), userId);
    }

    const next = { bookingId, dirty: false };
    await this.redisClient?.set(this.userSubscriptionKey(userId), JSON.stringify(next), {
      EX: SUBSCRIPTION_TTL_SECONDS,
    });

    if (bookingId) {
      await this.redisClient?.sAdd(this.bookingSubscribersKey(bookingId), userId);
      await this.redisClient?.expire(this.bookingSubscribersKey(bookingId), SUBSCRIPTION_TTL_SECONDS);
    }
  }

  async clearSubscriptionsForBooking(bookingId: string) {
    await this.ensureRedisClient();

    const userIds = await this.redisClient?.sMembers(this.bookingSubscribersKey(bookingId));
    const affectedUserIds = userIds ?? [];

    for (const userId of affectedUserIds) {
      await this.setUserSubscribedBooking(userId, null);
    }

    await this.redisClient?.del(this.bookingSubscribersKey(bookingId));
    return affectedUserIds;
  }

  async getUserSubscribedBooking(userId: string) {
    const record = await this.getSubscriptionRecord(userId);
    return record?.bookingId;
  }

  async hasUserSubscribedBookingOverride(userId: string) {
    await this.ensureRedisClient();
    const exists = await this.redisClient?.exists(this.userSubscriptionKey(userId));
    return Boolean(exists);
  }

  async flushToPostgres() {
    if (this.isFlushing) return;

    await this.ensureRedisClient();

    const lockToken = randomUUID();
    const lockAcquired = await this.redisClient?.set(this.flushLockKey(), lockToken, {
      NX: true,
      EX: 55,
    });

    if (lockAcquired !== "OK") return;

    this.isFlushing = true;

    try {
      const [dirtyDriverIds] = await Promise.all([this.redisClient?.sMembers(this.driverDirtySetKey())]);

      const driverIds = dirtyDriverIds ?? [];

      if (driverIds.length === 0) {
        return;
      }

      const driverEntries = await Promise.all(
        driverIds.map(async (id) => ({ id, state: await this.getDriverState(id) }))
      );
      await this.dbService.db.transaction(async (tx) => {
        for (const entry of driverEntries) {
          if (!entry.state?.dirty) continue;

          const updateData: Record<string, unknown> = {
            updatedAt: entry.state.updatedAt ?? new Date(),
          };

          if (entry.state.status !== undefined) updateData.status = entry.state.status;
          if (entry.state.lastLocationUpdate !== undefined) {
            updateData.lastLocationUpdate = entry.state.lastLocationUpdate;
          }
          if (entry.state.location !== undefined) {
            updateData.currentLocation =
              entry.state.location === null
                ? null
                : sql`ST_SetSRID(ST_MakePoint(${entry.state.location.x}, ${entry.state.location.y}), 4326)`;
          }

          await tx
            .update(users)
            .set(updateData)
            .where(and(eq(users.id, entry.id), eq(users.role, "DRIVER")));
        }
      });

      for (const entry of driverEntries) {
        if (!entry.state?.dirty) continue;
        entry.state.dirty = false;
        await this.redisClient?.set(this.driverKey(entry.id), JSON.stringify(entry.state));
        await this.redisClient?.sRem(this.driverDirtySetKey(), entry.id);
      }
    } catch (error) {
      this.logger.error({
        event: "kv_store_redis_flush_failed",
        error: (error as Error).message,
      });
    } finally {
      try {
        const currentLock = await this.redisClient?.get(this.flushLockKey());
        if (currentLock === lockToken) {
          await this.redisClient?.del(this.flushLockKey());
        }
      } catch {
        // no-op
      }
      this.isFlushing = false;
    }
  }

  private async saveBookingState(next: BookingState, previous: BookingState | null) {
    await this.ensureRedisClient();

    const nextPayload = {
      ...next,
      data: this.serializeBookingDates(next.data),
    };

    await this.redisClient?.set(this.bookingKey(next.id), JSON.stringify(nextPayload), {
      EX: BOOKING_STATE_TTL_SECONDS,
    });

    await this.updateBookingIndexes(previous, next);
  }

  private async updateBookingIndexes(previous: BookingState | null, next: BookingState) {
    await this.ensureRedisClient();

    const removeFrom = previous ? this.bookingIndexKeys(previous) : [];
    const addTo = this.bookingIndexKeys(next);

    if (previous) {
      for (const key of removeFrom) {
        await this.redisClient?.sRem(key, next.id);
      }
    }

    for (const key of addTo) {
      await this.redisClient?.sAdd(key, next.id);
      await this.redisClient?.expire(key, BOOKING_INDEX_TTL_SECONDS);
    }
  }

  private bookingIndexKeys(state: BookingState) {
    const keys: string[] = [];

    const status = state.data.status;
    const isActive = Boolean(status && ACTIVE_BOOKING_STATUSES.includes(status));
    const isTrackedActive = isActive;

    if (isTrackedActive && state.data.patientId) {
      keys.push(this.patientActiveIndexKey(state.data.patientId));
    }

    if (isTrackedActive && state.data.driverId) {
      keys.push(this.driverActiveIndexKey(state.data.driverId));
    }

    if (isTrackedActive && state.data.dispatcherId) {
      keys.push(this.dispatcherActiveIndexKey(state.data.dispatcherId));
    }

    if (state.data.driverId && state.data.ongoing) {
      keys.push(this.driverOngoingIndexKey(state.data.driverId));
    }

    return keys;
  }

  private async getIndexedBookingData(indexKey: string) {
    await this.ensureRedisClient();
    const bookingIds = await this.redisClient?.sMembers(indexKey);
    if (!bookingIds?.length) return [];

    const rows = await Promise.all(bookingIds.map((id) => this.getBookingData(id)));
    return rows.filter((row): row is Partial<Booking> & { id: string } => Boolean(row));
  }

  private async getSubscriptionRecord(userId: string) {
    await this.ensureRedisClient();
    const raw = await this.redisClient?.get(this.userSubscriptionKey(userId));
    if (!raw) return undefined;
    return JSON.parse(raw) as { bookingId: string | null; dirty: boolean };
  }

  private serializeBookingDates(data: Partial<Booking> & { id: string }) {
    const clone = { ...data } as Record<string, unknown>;
    for (const field of BOOKING_DATE_FIELDS) {
      const value = clone[field] as Date | null | undefined;
      if (value instanceof Date) {
        clone[field] = value.toISOString();
      }
    }
    return clone;
  }

  private hydrateBookingDates(data: Partial<Booking> & { id: string }) {
    const clone = { ...data } as Record<string, unknown>;
    for (const field of BOOKING_DATE_FIELDS) {
      const value = clone[field];
      if (typeof value === "string") {
        clone[field] = new Date(value);
      }
    }
    return clone as Partial<Booking> & { id: string };
  }

  private async ensureRedisClient() {
    if (!this.redisClient) {
      this.redisClient = createClient({
        url: env.REDIS_URL as string,
        socket: {
          connectTimeout: 1500,
          reconnectStrategy: false,
        },
      });
    }

    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  private bookingKey(bookingId: string) {
    return `ambulink:kv:booking:${bookingId}`;
  }

  private driverKey(driverId: string) {
    return `ambulink:kv:driver:${driverId}`;
  }

  private userSubscriptionKey(userId: string) {
    return `ambulink:kv:sub:${userId}`;
  }

  private bookingSubscribersKey(bookingId: string) {
    return `ambulink:kv:subscribers:${bookingId}`;
  }

  private patientActiveIndexKey(patientId: string) {
    return `ambulink:kv:idx:patient:${patientId}:active_new`;
  }

  private driverActiveIndexKey(driverId: string) {
    return `ambulink:kv:idx:driver:${driverId}:active_new`;
  }

  private dispatcherActiveIndexKey(dispatcherId: string) {
    return `ambulink:kv:idx:dispatcher:${dispatcherId}:active_new`;
  }

  private driverOngoingIndexKey(driverId: string) {
    return `ambulink:kv:idx:driver:${driverId}:ongoing_new`;
  }

  private driverDirtySetKey() {
    return "ambulink:kv:dirty:drivers";
  }

  private bookingDirtySetKey() {
    return "ambulink:kv:dirty:bookings";
  }

  private subscriptionDirtySetKey() {
    return "ambulink:kv:dirty:subscriptions";
  }

  private flushLockKey() {
    return "ambulink:kv:lock:flush";
  }
}
