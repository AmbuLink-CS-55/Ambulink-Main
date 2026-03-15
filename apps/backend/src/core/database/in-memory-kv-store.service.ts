import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { bookings, users, type Booking, type BookingStatus } from "@/core/database/schema";
import type { BookingNote } from "@ambulink/types";
import { DbService } from "./db.service";
import type { BookingState, CreateBookingValues, DriverState, KvStore } from "./kv-store.types";

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"];

@Injectable()
export class InMemoryKvStoreService implements KvStore {
  protected readonly logger = new Logger(InMemoryKvStoreService.name);
  protected flushInterval: NodeJS.Timeout | null = null;
  protected isFlushing = false;

  protected readonly drivers = new Map<string, DriverState>();
  protected readonly bookings = new Map<string, BookingState>();
  protected readonly userSubscriptions = new Map<string, { bookingId: string | null; dirty: boolean }>();

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
      pickupAddress: values.pickupAddress,
      pickupLocation: values.pickupLocation,
      status: "ASSIGNED",
      ongoing: true,
      providerId: values.providerId,
      driverId: values.driverId,
      hospitalId: values.hospitalId,
      dispatcherId: values.dispatcherId ?? null,
      emergencyType: values.emergencyType,
      patientProfileSnapshot: values.patientProfileSnapshot ?? null,
      fareEstimate: values.fareEstimate ?? null,
      emtNotes: [],
      assignedAt: now,
      requestedAt: now,
    } as Partial<Booking> & { id: string };

    this.bookings.set(id, { id, isNew: true, dirty: true, data });
    return data as Booking;
  }

  async updateBooking(bookingId: string, patch: Partial<Booking>) {
    const existing = this.bookings.get(bookingId);

    if (!existing) {
      this.bookings.set(bookingId, {
        id: bookingId,
        isNew: false,
        dirty: true,
        data: {
          id: bookingId,
          ...patch,
        },
      });
      return;
    }

    existing.data = {
      ...existing.data,
      ...patch,
    };
    existing.dirty = true;
  }

  async appendBookingNote(bookingId: string, note: BookingNote) {
    const existing = this.bookings.get(bookingId);
    const baseNotes = Array.isArray(existing?.data.emtNotes) ? existing.data.emtNotes : [];
    await this.updateBooking(bookingId, { emtNotes: [...baseNotes, note] });
  }

  async getBookingState(bookingId: string) {
    return this.bookings.get(bookingId);
  }

  async getBookingData(bookingId: string) {
    return this.bookings.get(bookingId)?.data;
  }

  async getActiveBookingByIdFromMemory(bookingId: string) {
    const state = this.bookings.get(bookingId);
    if (!state?.data.status || !ACTIVE_BOOKING_STATUSES.includes(state.data.status)) {
      return null;
    }

    return state.data;
  }

  async getNewActiveBookingsByPatient(patientId: string) {
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
    this.userSubscriptions.set(userId, { bookingId, dirty: true });
  }

  async clearSubscriptionsForBooking(bookingId: string) {
    const affectedUserIds: string[] = [];

    for (const [userId, state] of this.userSubscriptions.entries()) {
      if (state.bookingId !== bookingId) continue;
      this.userSubscriptions.set(userId, { bookingId: null, dirty: true });
      affectedUserIds.push(userId);
    }

    return affectedUserIds;
  }

  async getUserSubscribedBooking(userId: string) {
    return this.userSubscriptions.get(userId)?.bookingId;
  }

  async hasUserSubscribedBookingOverride(userId: string) {
    return this.userSubscriptions.has(userId);
  }

  async flushToPostgres() {
    if (this.isFlushing) return;

    const dirtyDriverEntries = [...this.drivers.entries()].filter(([, state]) => state.dirty);
    const dirtyBookingEntries = [...this.bookings.entries()].filter(([, state]) => state.dirty);
    const dirtySubscriptionEntries = [...this.userSubscriptions.entries()].filter(
      ([, state]) => state.dirty
    );

    if (
      dirtyDriverEntries.length === 0 &&
      dirtyBookingEntries.length === 0 &&
      dirtySubscriptionEntries.length === 0
    ) {
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

        for (const [userId, state] of dirtySubscriptionEntries) {
          await tx
            .update(users)
            .set({
              subscribedBookingId: state.bookingId,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));
        }

        for (const [bookingId, state] of dirtyBookingEntries) {
          const { pickupLocation, ...rest } = state.data;
          const updateData: Record<string, unknown> = {
            ...rest,
          };
          delete updateData.id;

          if (state.isNew) {
            await tx.insert(bookings).values({
              ...(updateData as Omit<Booking, "pickupLocation">),
              ...(pickupLocation
                ? {
                    pickupLocation: sql`ST_SetSRID(ST_MakePoint(${pickupLocation.x}, ${pickupLocation.y}), 4326)`,
                  }
                : {}),
            });
            state.isNew = false;
          } else {
            if (Object.keys(updateData).length > 0) {
              await tx.update(bookings).set(updateData).where(eq(bookings.id, bookingId));
            }

            if (pickupLocation !== undefined) {
              await tx
                .update(bookings)
                .set({
                  pickupLocation:
                    pickupLocation === null
                      ? null
                      : sql`ST_SetSRID(ST_MakePoint(${pickupLocation.x}, ${pickupLocation.y}), 4326)`,
                })
                .where(eq(bookings.id, bookingId));
            }
          }
        }
      });

      for (const [id] of dirtyDriverEntries) {
        const state = this.drivers.get(id);
        if (state) state.dirty = false;
      }

      for (const [id] of dirtySubscriptionEntries) {
        const state = this.userSubscriptions.get(id);
        if (state) state.dirty = false;
      }

      for (const [id] of dirtyBookingEntries) {
        const state = this.bookings.get(id);
        if (state) state.dirty = false;
      }
    } catch (error) {
      this.logger.error("Failed to flush in-memory state to Postgres", error as Error);
    } finally {
      this.isFlushing = false;
    }
  }
}
