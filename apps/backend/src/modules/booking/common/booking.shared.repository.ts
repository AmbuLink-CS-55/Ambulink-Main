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

  async createBooking(values: CreateBookingValues, _db: DbExecutor = this.dbService.db) {
    const booking = await this.kvStore.createBooking(values);
    return [booking];
  }

  async updateBooking(
    bookingId: string,
    booking: Partial<Booking>,
    db: DbExecutor = this.dbService.db
  ) {
    const tracked = await this.kvStore.getBookingState(bookingId);
    if (tracked) {
      await this.kvStore.updateBooking(bookingId, booking);
    } else {
      const [existing] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
      if (existing) {
        await this.kvStore.updateBooking(bookingId, { ...(existing as Booking), ...booking });
      } else {
        await this.kvStore.updateBooking(bookingId, booking);
      }
    }

    const [existing] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
    if (!existing) {
      return [(await this.kvStore.getBookingData(bookingId)) as Booking].filter(Boolean);
    }

    return [(await this.kvStore.applyBookingOverlay([existing]))[0] as Booking];
  }

  async getActiveBookingForPatient(patientId: string) {
    const kvActive = await this.kvStore.getNewActiveBookingsByPatient(patientId);
    if (kvActive.length > 0) {
      return kvActive as Booking[];
    }

    const rows = await this.dbService.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.patientId, patientId),
          inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );

    return this.kvStore.applyBookingOverlay(rows);
  }

  async getActiveBookingById(bookingId: string, db: DbExecutor = this.dbService.db) {
    const memoryBooking = await this.kvStore.getActiveBookingByIdFromMemory(bookingId);
    if (memoryBooking) {
      return [memoryBooking as Booking];
    }

    const rows = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.id, bookingId),
          inArray(bookings.status, ["ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
    return this.kvStore.applyBookingOverlay(rows);
  }

  async getUserSubscribedBooking(userId: string, db: DbExecutor = this.dbService.db) {
    if (await this.kvStore.hasUserSubscribedBookingOverride(userId)) {
      return [{ subscribedBookingId: await this.kvStore.getUserSubscribedBooking(userId) }];
    }

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
    await this.kvStore.setUserSubscribedBooking(userId, bookingId);
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) return [];

    return [{ id: user.id, subscribedBookingId: bookingId }];
  }

  async clearUserSubscribedBooking(userId: string, db: DbExecutor = this.dbService.db) {
    await this.kvStore.setUserSubscribedBooking(userId, null);
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) return [];

    return [{ id: user.id, subscribedBookingId: null }];
  }

  async clearSubscribedBookingForBooking(bookingId: string, db: DbExecutor = this.dbService.db) {
    const usersToClear = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.subscribedBookingId, bookingId));

    for (const user of usersToClear) {
      await this.kvStore.setUserSubscribedBooking(user.id, null);
    }

    const inMemoryUserIds = await this.kvStore.clearSubscriptionsForBooking(bookingId);
    const existingIds = new Set(usersToClear.map((user) => user.id));
    const extra = inMemoryUserIds
      .filter((userId) => !existingIds.has(userId))
      .map((userId) => ({ id: userId, role: "PATIENT" as const }));

    return [...usersToClear, ...extra];
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
    const kvActive = await this.kvStore.getNewActiveBookingsByDriver(driverId);
    if (kvActive.length > 0) {
      return kvActive as Booking[];
    }

    const rows = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.driverId, driverId),
          inArray(bookings.status, ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );
    return this.kvStore.applyBookingOverlay(rows);
  }

  async getOngoingBookingDispatchInfoForDriver(driverId: string, db: DbExecutor = this.dbService.db) {
    const kvOngoing = await this.kvStore.getNewOngoingDispatchBookingByDriver(driverId);
    if (kvOngoing) {
      return [kvOngoing];
    }

    const rows = await db
      .select({
        bookingId: bookings.id,
        patientId: bookings.patientId,
        dispatcherId: bookings.dispatcherId,
      })
      .from(bookings)
      .where(and(eq(bookings.ongoing, true), eq(bookings.driverId, driverId)));

    return this.kvStore.applyBookingOverlay(rows);
  }

  async getAssignedBookingPayloadRow(bookingId: string) {
    const rows = await this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
        requestedAt: bookings.requestedAt,
        assignedAt: bookings.assignedAt,
        arrivedAt: bookings.arrivedAt,
        pickedupAt: bookings.pickedupAt,
        completedAt: bookings.completedAt,
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
        providerHotline: sql<string | null>`${ambulanceProviders.hotlineNumber}`,
        hospitalId: hospitals.id,
        hospitalName: hospitals.name,
        hospitalPhone: hospitals.phoneNumber,
        hospitalLocationX: sql<number | null>`ST_X(${hospitals.location})`,
        hospitalLocationY: sql<number | null>`ST_Y(${hospitals.location})`,
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
      const [overlaid] = await this.kvStore.applyBookingOverlay(rows);
      return [await this.applyDriverLocationOverlay(overlaid)];
    }

    const memoryBooking = await this.kvStore.getBookingData(bookingId);
    if (!memoryBooking) return [];
    const row = await this.buildAssignedPayloadRowFromMemory(memoryBooking as Booking);
    return row ? [row] : [];
  }

  async getDispatcherBookingPayloadRow(bookingId: string) {
    const rows = await this.dbService.db
      .select({
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
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(eq(bookings.id, bookingId));

    if (rows[0]) {
      const [overlaid] = await this.kvStore.applyBookingOverlay(rows);
      return [await this.applyDriverLocationOverlay(overlaid)];
    }

    const memoryBooking = await this.kvStore.getBookingData(bookingId);
    if (!memoryBooking) return [];
    const row = await this.buildDispatcherPayloadRowFromMemory(memoryBooking as Booking);
    return row ? [row] : [];
  }

  async getDispatcherActiveBookingRows(dispatcherId: string) {
    const kvRows = await this.buildDispatcherActiveRowsFromMemory(dispatcherId);
    if (kvRows.length > 0) {
      return kvRows;
    }

    const rows = await this.dbService.db
      .select({
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
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(
        and(
          eq(bookings.dispatcherId, dispatcherId),
          inArray(bookings.status, ["ASSIGNED", "ARRIVED", "PICKEDUP"])
        )
      );

    const overlaidRows = await Promise.all(
      (await this.kvStore.applyBookingOverlay(rows)).map((row) => this.applyDriverLocationOverlay(row))
    );
    return overlaidRows;
  }

  getBookingLogRows(providerId?: string) {
    const conditions = [] as Array<ReturnType<typeof eq>>;
    conditions.push(eq(bookings.status, "COMPLETED"));

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

  private async buildAssignedPayloadRowFromMemory(booking: Booking) {
    const [{ patient } = { patient: null }] = await this.dbService.db
      .select({
        patient: {
          id: users.id,
          fullName: users.fullName,
          phoneNumber: users.phoneNumber,
          locationX: sql<number | null>`ST_X(${users.currentLocation})`,
          locationY: sql<number | null>`ST_Y(${users.currentLocation})`,
        },
      })
      .from(users)
      .where(eq(users.id, booking.patientId as string))
      .limit(1);

    const [{ driver } = { driver: null }] = await this.dbService.db
      .select({
        driver: {
          id: users.id,
          fullName: users.fullName,
          phoneNumber: users.phoneNumber,
          locationX: sql<number | null>`ST_X(${users.currentLocation})`,
          locationY: sql<number | null>`ST_Y(${users.currentLocation})`,
        },
      })
      .from(users)
      .where(eq(users.id, booking.driverId as string))
      .limit(1);

    const [{ provider } = { provider: null }] = await this.dbService.db
      .select({
        provider: {
          id: ambulanceProviders.id,
          name: ambulanceProviders.name,
          hotlineNumber: ambulanceProviders.hotlineNumber,
        },
      })
      .from(ambulanceProviders)
      .where(eq(ambulanceProviders.id, booking.providerId as string))
      .limit(1);

    const [{ hospital } = { hospital: null }] = await this.dbService.db
      .select({
        hospital: {
          id: hospitals.id,
          name: hospitals.name,
          phoneNumber: hospitals.phoneNumber,
          locationX: sql<number | null>`ST_X(${hospitals.location})`,
          locationY: sql<number | null>`ST_Y(${hospitals.location})`,
        },
      })
      .from(hospitals)
      .where(eq(hospitals.id, booking.hospitalId as string))
      .limit(1);

    if (!patient || !driver || !hospital) return null;

    const driverState = await this.kvStore.getDriverState(driver.id);

    return {
      bookingId: booking.id,
      status: booking.status,
      requestedAt: booking.requestedAt ?? null,
      assignedAt: booking.assignedAt ?? null,
      arrivedAt: booking.arrivedAt ?? null,
      pickedupAt: booking.pickedupAt ?? null,
      completedAt: booking.completedAt ?? null,
      pickupLocationX: booking.pickupLocation?.x ?? null,
      pickupLocationY: booking.pickupLocation?.y ?? null,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phoneNumber,
      patientLocationX: patient.locationX,
      patientLocationY: patient.locationY,
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phoneNumber,
      driverLocationX: driverState?.location?.x ?? driver.locationX,
      driverLocationY: driverState?.location?.y ?? driver.locationY,
      providerId: provider?.id ?? null,
      providerName: provider?.name ?? null,
      providerHotline: provider?.hotlineNumber ?? null,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalPhone: hospital.phoneNumber,
      hospitalLocationX: hospital.locationX,
      hospitalLocationY: hospital.locationY,
      patientProfileSnapshot: booking.patientProfileSnapshot ?? null,
      emtNotes: booking.emtNotes ?? [],
    };
  }

  private async buildDispatcherPayloadRowFromMemory(booking: Booking) {
    const assigned = await this.buildAssignedPayloadRowFromMemory(booking);
    if (!assigned) return null;

    return {
      bookingId: assigned.bookingId,
      status: assigned.status,
      pickupLocationX: assigned.pickupLocationX,
      pickupLocationY: assigned.pickupLocationY,
      patientId: assigned.patientId,
      patientName: assigned.patientName,
      patientPhone: assigned.patientPhone,
      patientLocationX: assigned.patientLocationX,
      patientLocationY: assigned.patientLocationY,
      driverId: assigned.driverId,
      driverName: assigned.driverName,
      driverPhone: assigned.driverPhone,
      driverLocationX: assigned.driverLocationX,
      driverLocationY: assigned.driverLocationY,
      providerId: assigned.providerId,
      providerName: assigned.providerName,
      hospitalId: assigned.hospitalId,
      hospitalName: assigned.hospitalName,
      hospitalPhone: assigned.hospitalPhone,
      hospitalLocationX: assigned.hospitalLocationX,
      hospitalLocationY: assigned.hospitalLocationY,
    };
  }

  private async buildDispatcherActiveRowsFromMemory(dispatcherId: string) {
    const states = await this.kvStore.getNewActiveBookingsByDispatcher(dispatcherId);

    const rows = await Promise.all(
      states.map((state) => this.buildDispatcherPayloadRowFromMemory(state as Booking))
    );
    return rows.filter((row): row is NonNullable<typeof row> => Boolean(row));
  }

  async appendBookingNote(bookingId: string, note: BookingNote, db: DbExecutor = this.dbService.db) {
    const memoryState = await this.kvStore.getBookingState(bookingId);
    if (memoryState?.data.emtNotes && Array.isArray(memoryState.data.emtNotes)) {
      await this.kvStore.appendBookingNote(bookingId, note);
      return [{ id: bookingId, emtNotes: (await this.kvStore.getBookingData(bookingId))?.emtNotes ?? [] }];
    }

    const [row] = await db
      .select({ id: bookings.id, emtNotes: bookings.emtNotes })
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!row) {
      await this.kvStore.appendBookingNote(bookingId, note);
      return [{ id: bookingId, emtNotes: (await this.kvStore.getBookingData(bookingId))?.emtNotes ?? [] }];
    }

    const baseNotes = Array.isArray(row.emtNotes) ? row.emtNotes : [];
    await this.kvStore.updateBooking(bookingId, { emtNotes: [...baseNotes, note] });

    return [{ id: bookingId, emtNotes: (await this.kvStore.getBookingData(bookingId))?.emtNotes ?? [] }];
  }

  appendEmtNote(bookingId: string, note: EmtNote, db: DbExecutor = this.dbService.db) {
    return this.appendBookingNote(bookingId, note, db);
  }
}
