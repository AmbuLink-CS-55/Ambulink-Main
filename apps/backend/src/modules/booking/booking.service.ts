import { Injectable } from "@nestjs/common";
import { desc, eq, ne, sql, inArray, and } from "drizzle-orm";
import { ambulanceProviders, bookings, hospitals, users } from "@/common/database/schema";
import type { Booking, BookingStatus, Hospital, User } from "@/common/database/schema";
import { or } from "drizzle-orm";
import { DbService } from "@/common/database/db.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { SocketService } from "@/common/socket/socket.service";
import type {
  DriverLocationUpdate,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
} from "@ambulink/types";

@Injectable()
export class BookingService {
  constructor(
    private dbService: DbService,
    private dispatcherService: DispatcherService,
    private socketService: SocketService
  ) {}

  async createBooking(
    patient: User,
    _patientLat: number,
    _patientLng: number,
    pickupAddr: string | null,
    hospital: Hospital,
    pickedDriver: User,
    emergencyType: string | null,
    dispatcherId?: string | null
  ) {
    const [createdBooking] = await this.dbService.db
      .insert(bookings)
      .values({
        patientId: patient.id,
        pickupAddress: pickupAddr,
        pickupLocation: sql`ST_SetSRID(ST_MakePoint(${_patientLng}, ${_patientLat}), 4326)`,

        status: "ASSIGNED",

        providerId: pickedDriver.providerId,
        driverId: pickedDriver.id,
        hospitalId: hospital.id,
        dispatcherId: dispatcherId ?? null,

        emergencyType: emergencyType,
        fareEstimate: null,

        assignedAt: new Date(),
      })
      .returning();

    if (!pickedDriver.providerId) {
      throw new Error("Driver without provider");
    }

    const provider = await this.dbService.db
      .select()
      .from(ambulanceProviders)
      .where(eq(ambulanceProviders.id, pickedDriver.providerId));

    return { patient, pickedDriver, provider, hospital, bookingId: createdBooking?.id ?? null };
  }

  async buildAssignedBookingPayload(bookingId: string) {
    const [row] = await this.dbService.db
      .select({
        bookingId: bookings.id,
        status: bookings.status,
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
      })
      .from(bookings)
      .innerJoin(users, eq(users.id, bookings.patientId))
      .leftJoin(sql`users as driver_user`, sql`driver_user.id = ${bookings.driverId}`)
      .leftJoin(ambulanceProviders, eq(ambulanceProviders.id, bookings.providerId))
      .leftJoin(hospitals, eq(hospitals.id, bookings.hospitalId))
      .where(eq(bookings.id, bookingId));

    if (!row || !row.driverId || !row.hospitalId) {
      return null;
    }

    const patientLocation =
      row.patientLocationX !== null && row.patientLocationY !== null
        ? { x: row.patientLocationX, y: row.patientLocationY }
        : null;
    const driverLocation =
      row.driverLocationX !== null && row.driverLocationY !== null
        ? { x: row.driverLocationX, y: row.driverLocationY }
        : null;
    const hospitalLocation =
      row.hospitalLocationX !== null && row.hospitalLocationY !== null
        ? { x: row.hospitalLocationX, y: row.hospitalLocationY }
        : null;

    return {
      bookingId: row.bookingId,
      status: row.status === "REQUESTED" ? "ASSIGNED" : row.status,
      patient: {
        id: row.patientId,
        fullName: row.patientName ?? null,
        phoneNumber: row.patientPhone ?? null,
        location: patientLocation,
      },
      driver: {
        id: row.driverId,
        fullName: row.driverName ?? null,
        phoneNumber: row.driverPhone ?? null,
        location: driverLocation,
        provider:
          row.providerId && row.providerName
            ? { id: row.providerId, name: row.providerName }
            : null,
      },
      hospital: {
        id: row.hospitalId,
        name: row.hospitalName ?? null,
        phoneNumber: row.hospitalPhone ?? null,
        location: hospitalLocation,
      },
      provider:
        row.providerId && row.providerName
          ? {
              id: row.providerId,
              name: row.providerName,
              hotlineNumber: row.providerHotline ?? null,
            }
          : null,
    };
  }

  async updateBooking(bookingId: string, booking: Partial<Booking>) {
    const updateData: Partial<Booking> = { ...booking };

    if (booking.status === "COMPLETED") {
      updateData.ongoing = false;
      updateData.completedAt = new Date();
    }

    if (booking.status === "CANCELLED") {
      updateData.ongoing = false;
    }

    const [updatedBooking] = await this.dbService.db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();

    if (updatedBooking?.dispatcherId) {
      if (updatedBooking.status === "REQUESTED") {
        return updatedBooking;
      }
      this.socketService.emitToDispatcher(updatedBooking.dispatcherId, "booking:update", {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (updatedBooking?.providerId) {
      this.socketService.emitToAllDispatchers("booking:log", {
        providerId: updatedBooking.providerId,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    return updatedBooking;
  }

  async getActiveBookingForPatient(patientId: string) {
    const ACTIVE_STATUSES = ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"] as const;
    const booking = await this.dbService.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.patientId, patientId), inArray(bookings.status, ACTIVE_STATUSES)));

    if (booking.length > 1) {
      console.log(`patient ${patientId} has more than one active bookings`);
    }
    return booking[0];
  }

  async getActiveBookingForDriver(driverId: string) {
    const ACTIVE_STATUSES = ["REQUESTED", "ASSIGNED", "ARRIVED", "PICKEDUP"] as const;
    const booking = await this.dbService.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.driverId, driverId), inArray(bookings.status, ACTIVE_STATUSES)));

    if (booking.length > 1) {
      console.log(`driver ${driverId} has more than one active bookings`);
    }
    return booking[0];
  }

  // TODO: remove
  async getOngoingBookingByUserId(userId: string) {
    const data = await this.dbService.db
      .select({
        id: bookings.id,
        patientId: bookings.patientId,
        driverId: bookings.driverId,
        status: bookings.status,
      })
      .from(bookings)
      .where(
        and(
          or(eq(bookings.patientId, userId), eq(bookings.driverId, userId)),
          ne(bookings.status, "COMPLETED")
        )
      );

    if (data.length > 1) {
      console.log("Something is wrong, users cannot have multiple uncompleted bookings");
    }
    return data[0];
  }

  async cancelByPatient(patientId: string, reason: string) {
    const [booking] = await this.dbService.db
      .update(bookings)
      .set({
        status: "CANCELLED",
        cancellationReason: reason,
      })
      .where(and(eq(bookings.patientId, patientId), ne(bookings.status, "COMPLETED")))
      .returning();

    return booking;
  }

  async askDispatchers(
    nearByDrivers: User[],
    patient: User
  ): Promise<
    | { status: "approved"; dispatcherId: string; pickedDriver: User; requestId: string }
    | { status: "failed"; reason: "no_dispatchers" | "all_rejected" }
  > {
    const requests = await Promise.all(
      nearByDrivers.map(async (driver) => {
        const dispatcherId = await this.dispatcherService.findLiveDispatchersByProvider(
          driver.providerId!
        );

        if (!dispatcherId) return null;

        const requestId = `req_${Date.now()}_${driver.id}`;
        return { dispatcherId, driver, requestId };
      })
    );

    const activeRequests = requests.filter(
      (request): request is { dispatcherId: string; driver: User; requestId: string } =>
        Boolean(request)
    );

    if (activeRequests.length === 0) {
      console.error("No available dispatchers for nearby drivers");
      return { status: "failed", reason: "no_dispatchers" };
    }

    const approvalPromises = activeRequests.map(({ dispatcherId, driver, requestId }) =>
      this.waitForDispatcherApproval(dispatcherId, driver, patient, requestId).then((result) => ({
        ...result,
        requestId,
      }))
    );

    try {
      const winningResponse = await Promise.any(approvalPromises);
      await this.notifyDispatcherDecision(
        activeRequests.map(({ dispatcherId, requestId }) => ({ dispatcherId, requestId })),
        winningResponse.dispatcherId
      );
      return { status: "approved", ...winningResponse };
    } catch (_error) {
      console.error("All dispatchers rejected the request");
      return { status: "failed", reason: "all_rejected" };
    }
  }

  private async waitForDispatcherApproval(
    dispatcherId: string,
    driver: User,
    patient: User,
    requestId: string
  ): Promise<{ dispatcherId: string; pickedDriver: User }> {
    return new Promise((resolve, reject) => {
      this.socketService.dispatcherServer
        ?.to(`dispatcher:${dispatcherId}`)
        .timeout(30000)
        .emit(
          "booking:new",
          {
            requestId,
            driver: {
              id: driver.id,
              providerId: driver.providerId,
              currentLocation: driver.currentLocation ?? null,
            },
            patient: {
              id: patient.id,
              fullName: patient.fullName ?? null,
              phoneNumber: patient.phoneNumber ?? null,
              email: patient.email ?? null,
              currentLocation: patient.currentLocation ?? null,
            },
          },
          (err: any, response: any) => {
            // response is a array
            if (err || !response[0]?.approved) {
              return reject("Dispatcher declined or ignored");
            }

            resolve({ dispatcherId: dispatcherId, pickedDriver: driver });
          }
        );
    });
  }

  private async notifyDispatcherDecision(
    dispatcherRequests: { dispatcherId: string; requestId: string }[],
    winnerDispatcherId: string
  ) {
    if (!this.socketService.dispatcherServer) return;

    const [winner] = await this.dbService.db
      .select({
        id: users.id,
        name: users.fullName,
        providerName: ambulanceProviders.name,
      })
      .from(users)
      .leftJoin(ambulanceProviders, eq(users.providerId, ambulanceProviders.id))
      .where(eq(users.id, winnerDispatcherId));

    const winnerPayload = {
      id: winnerDispatcherId,
      name: winner?.name ?? null,
      providerName: winner?.providerName ?? null,
    };

    dispatcherRequests.forEach(({ dispatcherId, requestId }) => {
      this.socketService.dispatcherServer
        ?.to(`dispatcher:${dispatcherId}`)
        .emit("booking:decision", {
          requestId,
          isWinner: dispatcherId === winnerDispatcherId,
          winner: winnerPayload,
        });
    });
  }

  async sendDriverLocation(driverId: string, data: DriverLocationUpdate) {
    const [booking] = await this.dbService.db
      .select({
        patientId: bookings.patientId,
        dispatcherId: bookings.dispatcherId,
      })
      .from(bookings)
      .where(and(eq(bookings.ongoing, true), eq(bookings.driverId, driverId)));
    if (!booking) {
      return;
    }
    const { patientId, dispatcherId } = booking;
    if (!patientId || !dispatcherId) {
      return;
    }
    this.socketService.emitToDispatcher(dispatcherId, "driver:update", data);
    this.socketService.emitToPatient(patientId, "driver:update", data);
  }

  private mapDispatcherBookingPayload(
    row: {
      bookingId: string;
      status: BookingStatus;
      pickupLocationX: number | null;
      pickupLocationY: number | null;
      patientId: string;
      patientName: string | null;
      patientPhone: string | null;
      patientLocationX: number | null;
      patientLocationY: number | null;
      driverId: string | null;
      driverName: string | null;
      driverPhone: string | null;
      driverLocationX: number | null;
      driverLocationY: number | null;
      providerId: string | null;
      providerName: string | null;
      hospitalId: string | null;
      hospitalName: string | null;
      hospitalPhone: string | null;
      hospitalLocationX: number | null;
      hospitalLocationY: number | null;
    },
    requestId?: string
  ): DispatcherBookingPayload | null {
    if (!row.driverId || !row.hospitalId) {
      return null;
    }

    const status = row.status === "REQUESTED" ? "ASSIGNED" : row.status;
    const pickupLocation =
      row.pickupLocationX !== null && row.pickupLocationY !== null
        ? { x: row.pickupLocationX, y: row.pickupLocationY }
        : null;
    const patientLocation =
      row.patientLocationX !== null && row.patientLocationY !== null
        ? { x: row.patientLocationX, y: row.patientLocationY }
        : null;
    const driverLocation =
      row.driverLocationX !== null && row.driverLocationY !== null
        ? { x: row.driverLocationX, y: row.driverLocationY }
        : null;
    const hospitalLocation =
      row.hospitalLocationX !== null && row.hospitalLocationY !== null
        ? { x: row.hospitalLocationX, y: row.hospitalLocationY }
        : null;

    return {
      bookingId: row.bookingId,
      requestId,
      status,
      pickupLocation,
      patient: {
        id: row.patientId,
        fullName: row.patientName ?? null,
        phoneNumber: row.patientPhone ?? null,
        location: patientLocation,
      },
      driver: {
        id: row.driverId,
        fullName: row.driverName ?? null,
        phoneNumber: row.driverPhone ?? null,
        location: driverLocation,
        provider:
          row.providerId && row.providerName
            ? { id: row.providerId, name: row.providerName }
            : null,
      },
      hospital: {
        id: row.hospitalId,
        name: row.hospitalName ?? null,
        phoneNumber: row.hospitalPhone ?? null,
        location: hospitalLocation,
      },
      provider:
        row.providerId && row.providerName ? { id: row.providerId, name: row.providerName } : null,
    } satisfies DispatcherBookingPayload;
  }

  async getDispatcherActiveBookings(dispatcherId: string) {
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

    return rows
      .map((row) => this.mapDispatcherBookingPayload(row))
      .filter((payload): payload is DispatcherBookingPayload => payload !== null);
  }

  async buildDispatcherBookingPayload(bookingId: string, requestId?: string) {
    const [row] = await this.dbService.db
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

    if (!row) return null;

    return this.mapDispatcherBookingPayload(row, requestId);
  }

  async getBookingLog(providerId?: string, status?: string) {
    const conditions = [] as Array<ReturnType<typeof eq>>;

    if (providerId) {
      conditions.push(eq(bookings.providerId, providerId));
    }

    if (status) {
      conditions.push(eq(bookings.status, status as any));
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
}
