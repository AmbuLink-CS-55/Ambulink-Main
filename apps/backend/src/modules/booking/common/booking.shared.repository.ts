import { Inject, Injectable } from "@nestjs/common";
import { eq, and, sql, inArray, desc, isNotNull, ilike, asc } from "drizzle-orm";
import { ambulanceProviders, bookings, hospitals, users } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { KV_STORE, type KvStore } from "@/core/database/kv-store.types";
import type { Booking } from "@/core/database/schema";
import type { BookingNote, EmtNote, PatientSettingsData } from "@ambulink/types";

type CreateBookingValues = {
  patientId: string;
  pickupAddress: string | null;
  pickupLocation: { x: number; y: number };
  providerId: string | null;
  driverId: string;
  hospitalId: string;
  dispatcherId?: string | null;
  emergencyType: string | null;
  fareEstimate?: string | null;
  patientProfileSnapshot?: PatientSettingsData | null;
};

@Injectable()
export class BookingSharedRepository {
  constructor(
    private dbService: DbService,
    @Inject(KV_STORE) private kvStore: KvStore
  ) {}

  async createBooking(values: CreateBookingValues, db: DbExecutor = this.dbService.db) {
    const now = new Date();
    const created = await db
      .insert(bookings)
      .values({
        patientId: values.patientId,
        pickupAddress: values.pickupAddress,
        pickupLocation: sql`ST_SetSRID(ST_MakePoint(${values.pickupLocation.x}, ${values.pickupLocation.y}), 4326)`,
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
      })
      .returning();

    const booking = created[0];
    if (booking) {
      await this.kvStore.updateBooking(booking.id, {
        id: booking.id,
        patientId: booking.patientId,
        driverId: booking.driverId,
        dispatcherId: booking.dispatcherId,
        status: booking.status,
        ongoing: booking.ongoing,
        requestedAt: booking.requestedAt,
        assignedAt: booking.assignedAt,
      });
    }

    return created;
  }

  async updateBooking(
    bookingId: string,
    booking: Partial<Booking>,
    db: DbExecutor = this.dbService.db
  ) {
    const { pickupLocation, ...rest } = booking;
    const updateData: Record<string, unknown> = {
      ...rest,
    };
    delete updateData.id;

    if (Object.keys(updateData).length > 0) {
      await db.update(bookings).set(updateData).where(eq(bookings.id, bookingId));
    }

    if (pickupLocation !== undefined) {
      await db
        .update(bookings)
        .set({
          pickupLocation:
            pickupLocation === null
              ? null
              : sql`ST_SetSRID(ST_MakePoint(${pickupLocation.x}, ${pickupLocation.y}), 4326)`,
        })
        .where(eq(bookings.id, bookingId));
    }

    await this.kvStore.updateBooking(bookingId, booking);
    return db.select().from(bookings).where(eq(bookings.id, bookingId));
  }

  async getActiveBookingForPatient(patientId: string) {
    return this.dbService.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.patientId, patientId),
          inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
  }

  async getActiveBookingById(bookingId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.id, bookingId),
          inArray(bookings.status, ["ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
  }

  async getUserSubscribedBooking(userId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select({ subscribedBookingId: users.subscribedBookingId })
      .from(users)
      .where(eq(users.id, userId));
  }

  async setUserSubscribedBooking(
    userId: string,
    bookingId: string,
    db: DbExecutor = this.dbService.db
  ) {
    const rows = await db
      .update(users)
      .set({
        subscribedBookingId: bookingId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id, subscribedBookingId: users.subscribedBookingId });
    await this.kvStore.setUserSubscribedBooking(userId, bookingId);
    return rows;
  }

  async clearUserSubscribedBooking(userId: string, db: DbExecutor = this.dbService.db) {
    const rows = await db
      .update(users)
      .set({
        subscribedBookingId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id, subscribedBookingId: users.subscribedBookingId });
    await this.kvStore.setUserSubscribedBooking(userId, null);
    return rows;
  }

  async clearSubscribedBookingForBooking(bookingId: string, db: DbExecutor = this.dbService.db) {
    const usersToClear = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.subscribedBookingId, bookingId));

    await db
      .update(users)
      .set({
        subscribedBookingId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.subscribedBookingId, bookingId));
    await this.kvStore.clearSubscriptionsForBooking(bookingId);

    return usersToClear;
  }

  getEmtsSubscribedToBooking(bookingId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select({
        emtId: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "EMT"),
          eq(users.isActive, true),
          eq(users.subscribedBookingId, bookingId),
          isNotNull(users.providerId)
        )
      );
  }

  async cancelBookingByPatient(
    patientId: string,
    reason: string,
    db: DbExecutor = this.dbService.db
  ) {
    const activeBookings = await this.getActiveBookingForPatient(patientId);
    const active = activeBookings.find((booking) => booking.status !== "COMPLETED");
    if (!active) return [];

    return this.updateBooking(
      active.id,
      {
        status: "CANCELLED",
        ongoing: false,
        cancellationReason: reason,
      },
      db
    );
  }

  async getDriverActiveBooking(driverId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.driverId, driverId),
          inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
  }

  async getOngoingBookingDispatchInfoForDriver(driverId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select({
        bookingId: bookings.id,
        patientId: bookings.patientId,
        dispatcherId: bookings.dispatcherId,
        providerId: bookings.providerId,
      })
      .from(bookings)
      .where(and(eq(bookings.ongoing, true), eq(bookings.driverId, driverId)));
  }

  async getAssignedBookingPayloadRow(bookingId: string) {
    const rows = await this.dbService.db
      .select({
        ...this.dispatcherBookingColumns(),
        requestedAt: bookings.requestedAt,
        assignedAt: bookings.assignedAt,
        arrivedAt: bookings.arrivedAt,
        pickedupAt: bookings.pickedupAt,
        completedAt: bookings.completedAt,
        providerHotline: sql<string | null>`${ambulanceProviders.hotlineNumber}`,
        patientProfileSnapshot: bookings.patientProfileSnapshot,
        emtNotes: bookings.emtNotes,
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(eq(bookings.id, bookingId));

    if (rows[0]) {
      return [await this.applyDriverLocationOverlay(rows[0])];
    }

    return [];
  }

  async getDispatcherBookingPayloadRow(bookingId: string) {
    const rows = await this.dispatcherBookingQuery()
      .where(eq(bookings.id, bookingId));

    if (rows[0]) {
      return [await this.applyDriverLocationOverlay(rows[0])];
    }

    return [];
  }

  async getDispatcherActiveBookingRows(dispatcherId: string) {
    const rows = await this.dispatcherBookingQuery()
      .where(
        and(
          eq(bookings.dispatcherId, dispatcherId),
          inArray(bookings.status, ["ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );

    return Promise.all(rows.map((row) => this.applyDriverLocationOverlay(row)));
  }

  async getProviderActiveBookingRows(providerId: string) {
    const rows = await this.dispatcherBookingQuery()
      .where(
        and(
          eq(bookings.providerId, providerId),
          inArray(bookings.status, ["ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );

    return Promise.all(rows.map((row) => this.applyDriverLocationOverlay(row)));
  }

  getBookingLogRows(providerId?: string) {
    const conditions = [] as Array<ReturnType<typeof eq>>;

    if (providerId) {
      conditions.push(eq(bookings.providerId, providerId));
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const baseQuery = this.dbService.db
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
  }

  getBookingDetailsRow(bookingId: string, db: DbExecutor = this.dbService.db) {
    return db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        requestedAt: bookings.requestedAt,
        assignedAt: bookings.assignedAt,
        arrivedAt: bookings.arrivedAt,
        pickedupAt: bookings.pickedupAt,
        completedAt: bookings.completedAt,
        cancellationReason: bookings.cancellationReason,
        patientId: users.id,
        patientName: users.fullName,
        patientPhone: users.phoneNumber,
        driverId: sql<string | null>`${bookings.driverId}`,
        driverName: sql<string | null>`driver_user.full_name`,
        driverPhone: sql<string | null>`driver_user.phone_number`,
        providerId: sql<string | null>`${bookings.providerId}`,
        providerName: sql<string | null>`${ambulanceProviders.name}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
        hospitalPhone: hospitals.phoneNumber,
        notes: bookings.emtNotes,
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(eq(bookings.id, bookingId));
  }

  searchOngoingBookingsByProvider(providerId: string, query: string, limit?: number) {
    const normalizedQuery = query.trim();
    const baseQuery = this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.providerId, providerId),
          inArray(bookings.status, ["ASSIGNED", "ARRIVED", "PICKEDUP"]),
          ilike(sql<string>`${bookings.id}::text`, `${normalizedQuery}%`)
        )
      )
      .orderBy(asc(bookings.requestedAt));

    if (typeof limit === "number") {
      return baseQuery.limit(limit);
    }

    return baseQuery;
  }

  private dispatcherBookingColumns() {
    return {
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
    };
  }

  private dispatcherBookingQuery() {
    return this.dbService.db
      .select(this.dispatcherBookingColumns())
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId));
  }

  private async applyDriverLocationOverlay(row: Record<string, unknown>) {
    if (!row.driverId) return row;

    const driverState = await this.kvStore.getDriverState(row.driverId as string);
    if (!driverState?.location) return row;

    return {
      ...row,
      driverLocationX: driverState.location.x,
      driverLocationY: driverState.location.y,
    };
  }

  async appendBookingNote(bookingId: string, note: BookingNote, db: DbExecutor = this.dbService.db) {
    const [row] = await db
      .select({ id: bookings.id, emtNotes: bookings.emtNotes })
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!row) return [];

    const baseNotes = Array.isArray(row.emtNotes) ? row.emtNotes : [];
    return db
      .update(bookings)
      .set({ emtNotes: [...baseNotes, note] })
      .where(eq(bookings.id, bookingId))
      .returning({ id: bookings.id, emtNotes: bookings.emtNotes });
  }

  appendEmtNote(bookingId: string, note: EmtNote, db: DbExecutor = this.dbService.db) {
    return this.appendBookingNote(bookingId, note, db);
  }
}
