import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { users, type Booking, type BookingStatus } from "@/core/database/schema";
import type { BookingNote } from "@ambulink/types";
import { DbService } from "./db.service";
import type { BookingState, CreateBookingValues, DriverState, KvStore } from "./kv-store.types";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"];
const BOOKING_STATE_TTL_MS = 30 * 60 * 1000;
const SUBSCRIPTION_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class InMemoryKvStoreService implements KvStore {
  protected readonly logger = new Logger(InMemoryKvStoreService.name);
  protected flushInterval: NodeJS.Timeout | null = null;
  protected isFlushing = false;

  protected readonly drivers = new Map<string, DriverState>();
  protected readonly bookings = new Map<string, BookingState>();
  protected readonly userSubscriptions = new Map<string, { bookingId: string | null; dirty: boolean }>();
  protected readonly bookingExpiry = new Map<string, number>();
  protected readonly subscriptionExpiry = new Map<string, number>();

  constructor(private dbService: DbService) {}

  async initialize() {
    this.flushInterval = setInterval(() => {
      void this.flushToPostgres();
    }, 10 * 60 * 1000);
  }

  async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flushToPostgres();
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

    this.bookings.set(id, { id, isNew: false, dirty: false, data });
    this.bookingExpiry.set(id, Date.now() + BOOKING_STATE_TTL_MS);
    return data as Booking;
  }

  async updateBooking(bookingId: string, patch: Partial<Booking>) {
    const sanitizedPatch = this.sanitizeBookingPatch(patch);
    const existing = this.bookings.get(bookingId);

    if (!existing) {
      this.bookings.set(bookingId, {
        id: bookingId,
        isNew: false,
        dirty: false,
        data: {
          id: bookingId,
          ...sanitizedPatch,
        },
      });
      this.bookingExpiry.set(bookingId, Date.now() + BOOKING_STATE_TTL_MS);
      return;
    }

    existing.data = {
      ...existing.data,
      ...sanitizedPatch,
    };
    existing.dirty = false;
    this.bookingExpiry.set(bookingId, Date.now() + BOOKING_STATE_TTL_MS);
  }

  async appendBookingNote(bookingId: string, note: BookingNote) {
    const existing = this.bookings.get(bookingId);
    const baseNotes = Array.isArray(existing?.data.emtNotes) ? existing.data.emtNotes : [];
    await this.updateBooking(bookingId, { emtNotes: [...baseNotes, note] });
  }

  async getBookingState(bookingId: string) {
    if (this.isBookingExpired(bookingId)) return undefined;
    return this.bookings.get(bookingId);
  }

  async getBookingData(bookingId: string) {
    if (this.isBookingExpired(bookingId)) return undefined;
    return this.bookings.get(bookingId)?.data;
  }

  async getActiveBookingByIdFromMemory(bookingId: string) {
    if (this.isBookingExpired(bookingId)) return null;
    const state = this.bookings.get(bookingId);
    if (!state?.data.status || !ACTIVE_BOOKING_STATUSES.includes(state.data.status)) {
      return null;
    }

    return state.data;
  }

  async getNewActiveBookingsByPatient(patientId: string) {
    this.cleanupExpiredBookings();
    return [...this.bookings.values()]
      .filter(
        (state) =>
          state.data.patientId === patientId &&
          state.data.status &&
          ACTIVE_BOOKING_STATUSES.includes(state.data.status)
      )
      .map((state) => state.data);
  }

  async getNewActiveBookingsByDriver(driverId: string) {
    this.cleanupExpiredBookings();
    return [...this.bookings.values()]
      .filter(
        (state) =>
          state.data.driverId === driverId &&
          state.data.status &&
          ACTIVE_BOOKING_STATUSES.includes(state.data.status)
      )
      .map((state) => state.data);
  }

  async getNewActiveBookingsByDispatcher(dispatcherId: string) {
    this.cleanupExpiredBookings();
    return [...this.bookings.values()]
      .filter(
        (state) =>
          state.data.dispatcherId === dispatcherId &&
          state.data.status &&
          ["ASSIGNED", "ARRIVED", "PICKEDUP"].includes(state.data.status)
      )
      .map((state) => state.data);
  }

  async getNewOngoingDispatchBookingByDriver(driverId: string) {
    this.cleanupExpiredBookings();
    for (const state of this.bookings.values()) {
      if (state.data.driverId !== driverId) continue;
      if (!state.data.ongoing) continue;

      return {
        bookingId: state.id,
        patientId: state.data.patientId ?? null,
        dispatcherId: state.data.dispatcherId ?? null,
      };
    }

    return null;
  }

  async applyBookingOverlay<T extends Record<string, any>>(rows: T[]): Promise<T[]> {
    this.cleanupExpiredBookings();
    return rows
      .map((row) => {
        const bookingId = (row.id ?? row.bookingId) as string | undefined;
        if (!bookingId) return row;
        const state = this.bookings.get(bookingId);
        if (!state) return row;
        return { ...row, ...state.data } as T;
      })
      .filter((row) => {
        const status = (row as { status?: BookingStatus }).status;
        if (!status) return true;
        return ACTIVE_BOOKING_STATUSES.includes(status);
      }) as T[];
  }

  async setDriverState(driverId: string, patch: Omit<DriverState, "dirty">) {
    const existing = this.drivers.get(driverId);
    if (!existing) {
      this.drivers.set(driverId, { ...patch, dirty: true });
      return;
    }

    this.drivers.set(driverId, {
      ...existing,
      ...patch,
      dirty: true,
    });
  }

  async getDriverState(driverId: string) {
    return this.drivers.get(driverId);
  }

  async applyDriverOverlay<T extends Record<string, any>>(rows: T[]): Promise<T[]> {
    return rows.map((row) => {
      const driverId = row.id as string | undefined;
      if (!driverId) return row;
      const state = this.drivers.get(driverId);
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
    }) as T[];
  }

  getAllDriverStates() {
    return [...this.drivers.entries()];
  }

  async setUserSubscribedBooking(userId: string, bookingId: string | null) {
    this.userSubscriptions.set(userId, { bookingId, dirty: false });
    this.subscriptionExpiry.set(userId, Date.now() + SUBSCRIPTION_TTL_MS);
  }

  async clearSubscriptionsForBooking(bookingId: string) {
    this.cleanupExpiredSubscriptions();
    const affectedUserIds: string[] = [];

    for (const [userId, state] of this.userSubscriptions.entries()) {
      if (state.bookingId !== bookingId) continue;
      this.userSubscriptions.set(userId, { bookingId: null, dirty: false });
      this.subscriptionExpiry.set(userId, Date.now() + SUBSCRIPTION_TTL_MS);
      affectedUserIds.push(userId);
    }

    return affectedUserIds;
  }

  async getUserSubscribedBooking(userId: string) {
    if (this.isSubscriptionExpired(userId)) return undefined;
    return this.userSubscriptions.get(userId)?.bookingId;
  }

  async hasUserSubscribedBookingOverride(userId: string) {
    if (this.isSubscriptionExpired(userId)) return false;
    return this.userSubscriptions.has(userId);
  }

  async flushToPostgres() {
    if (this.isFlushing) return;

    const dirtyDriverEntries = [...this.drivers.entries()].filter(([, state]) => state.dirty);

    if (dirtyDriverEntries.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      await this.dbService.db.transaction(async (tx) => {
        for (const [driverId, state] of dirtyDriverEntries) {
          const updateData: Record<string, unknown> = {
            updatedAt: state.updatedAt ?? new Date(),
          };

          if (state.status !== undefined) {
            updateData.status = state.status;
          }

          if (state.lastLocationUpdate !== undefined) {
            updateData.lastLocationUpdate = state.lastLocationUpdate;
          }

          if (state.location !== undefined) {
            updateData.currentLocation =
              state.location === null
                ? null
                : sql`ST_SetSRID(ST_MakePoint(${state.location.x}, ${state.location.y}), 4326)`;
          }

          await tx
            .update(users)
            .set(updateData)
            .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
        }

      });

      for (const [id] of dirtyDriverEntries) {
        const state = this.drivers.get(id);
        if (state) state.dirty = false;
      }

    } catch (error) {
      this.logger.error("Failed to flush in-memory state to Postgres", error as Error);
    } finally {
      this.isFlushing = false;
    }
  }

  private sanitizeBookingPatch(patch: Partial<Booking>): Partial<Booking> {
    const allowed: Partial<Booking> = {};
    if (patch.id !== undefined) allowed.id = patch.id;
    if (patch.patientId !== undefined) allowed.patientId = patch.patientId;
    if (patch.driverId !== undefined) allowed.driverId = patch.driverId;
    if (patch.dispatcherId !== undefined) allowed.dispatcherId = patch.dispatcherId;
    if (patch.emtId !== undefined) allowed.emtId = patch.emtId;
    if (patch.status !== undefined) allowed.status = patch.status;
    if (patch.ongoing !== undefined) allowed.ongoing = patch.ongoing;
    if (patch.requestedAt !== undefined) allowed.requestedAt = patch.requestedAt;
    if (patch.assignedAt !== undefined) allowed.assignedAt = patch.assignedAt;
    if (patch.arrivedAt !== undefined) allowed.arrivedAt = patch.arrivedAt;
    if (patch.pickedupAt !== undefined) allowed.pickedupAt = patch.pickedupAt;
    if (patch.completedAt !== undefined) allowed.completedAt = patch.completedAt;
    return allowed;
  }

  private isBookingExpired(bookingId: string) {
    const expiresAt = this.bookingExpiry.get(bookingId);
    if (!expiresAt) return false;
    if (Date.now() <= expiresAt) return false;
    this.bookingExpiry.delete(bookingId);
    this.bookings.delete(bookingId);
    return true;
  }

  private cleanupExpiredBookings() {
    for (const bookingId of this.bookingExpiry.keys()) {
      this.isBookingExpired(bookingId);
    }
  }

  private isSubscriptionExpired(userId: string) {
    const expiresAt = this.subscriptionExpiry.get(userId);
    if (!expiresAt) return false;
    if (Date.now() <= expiresAt) return false;
    this.subscriptionExpiry.delete(userId);
    this.userSubscriptions.delete(userId);
    return true;
  }

  private cleanupExpiredSubscriptions() {
    for (const userId of this.subscriptionExpiry.keys()) {
      this.isSubscriptionExpired(userId);
    }
  }
}
