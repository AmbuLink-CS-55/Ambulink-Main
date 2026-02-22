import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { ambulanceProviders, bookings, users } from "@/common/database/schema";
import type { Booking, Hospital, User } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { SocketService } from "@/common/socket/socket.service";
import type {
  DriverLocationUpdate,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
} from "@ambulink/types";
import { mapAssignedBookingPayload, mapDispatcherBookingPayload } from "@/mappers";
import {
  createPatient,
  createBooking,
  findDriverById,
  findPatientById,
  getDriverActiveBooking,
  getHospitalById,
  getAssignedBookingPayloadRow,
  updateBooking as updateBookingQuery,
  getActiveBookingForPatient,
  cancelBookingByPatient,
  getOngoingBookingByUserId,
  getDispatcherBookingPayloadRow,
  getDispatcherActiveBookingRows,
  getBookingLogRows,
  getOngoingBookingDispatchInfoForDriver,
  getDispatcherWinnerInfo,
  setDriverStatus,
} from "@/common/queries";
import type { ManualAssignBookingDto, ReassignBookingDto } from "@/common/validation/schemas";

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
    const [createdBooking] = await createBooking(this.dbService.db, {
      patientId: patient.id,
      pickupAddress: pickupAddr,
      pickupLocation: { x: _patientLng, y: _patientLat },
      providerId: pickedDriver.providerId,
      driverId: pickedDriver.id,
      hospitalId: hospital.id,
      dispatcherId: dispatcherId ?? null,
      emergencyType: emergencyType,
      fareEstimate: null,
    });

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
    const [row] = await getAssignedBookingPayloadRow(this.dbService.db, bookingId);
    return mapAssignedBookingPayload(row);
  }

  async manualAssignBooking(payload: ManualAssignBookingDto) {
    const dispatcher = await this.getDispatcherOrThrow(payload.dispatcherId);
    const driver = await this.getDriverForDispatcherOrThrow(
      payload.driverId,
      dispatcher.providerId
    );
    console.log(payload.hospitalId);
    const hospital = await this.getHospitalOrThrow(payload.hospitalId);

    const activeDriverBookings = await getDriverActiveBooking(this.dbService.db, payload.driverId);
    if (activeDriverBookings.length > 0) {
      throw new BadRequestException("Selected driver already has an active booking");
    }

    const patient = await this.resolvePatientForManualAssignment(payload);
    const pickupAddress = payload.pickupAddress ?? null;
    const emergencyType = payload.emergencyType ?? null;

    const booking = await this.createBooking(
      patient,
      payload.pickupLocation.y,
      payload.pickupLocation.x,
      pickupAddress,
      hospital,
      driver,
      emergencyType,
      payload.dispatcherId
    );

    if (!booking.bookingId) {
      throw new BadRequestException("Booking creation failed");
    }

    await setDriverStatus(this.dbService.db, driver.id, "BUSY");

    const assignedPayload = await this.buildAssignedBookingPayload(booking.bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(booking.bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException("Failed to build booking payload");
    }

    this.socketService.emitToDispatcher(
      payload.dispatcherId,
      "booking:assigned",
      dispatcherPayload
    );
    this.socketService.emitToDriver(driver.id, "booking:assigned", assignedPayload);
    this.socketService.emitToPatient(patient.id, "booking:assigned", assignedPayload);

    return {
      bookingId: booking.bookingId,
      assignedPayload,
      dispatcherPayload,
    };
  }

  async reassignBooking(bookingId: string, payload: ReassignBookingDto) {
    const dispatcher = await this.getDispatcherOrThrow(payload.dispatcherId);
    const [booking] = await this.dbService.db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (!booking.providerId || booking.providerId !== dispatcher.providerId) {
      throw new ForbiddenException("Dispatcher cannot reassign booking outside provider scope");
    }

    if (booking.dispatcherId && booking.dispatcherId !== payload.dispatcherId) {
      throw new ForbiddenException("Only the assigned dispatcher can reassign this booking");
    }

    if (!["ASSIGNED", "ARRIVED", "PICKEDUP"].includes(booking.status)) {
      throw new BadRequestException("Only active bookings can be reassigned");
    }

    const updateData: Partial<Booking> = {};

    if (payload.hospitalId) {
      await this.getHospitalOrThrow(payload.hospitalId);
      updateData.hospitalId = payload.hospitalId;
    }

    if (payload.pickupAddress !== undefined) {
      updateData.pickupAddress = payload.pickupAddress;
    }

    const previousDriverId = booking.driverId;
    let nextDriverId = booking.driverId;

    if (payload.driverId && payload.driverId !== booking.driverId) {
      const nextDriver = await this.getDriverForDispatcherOrThrow(
        payload.driverId,
        dispatcher.providerId
      );
      const activeTargetBookings = await getDriverActiveBooking(
        this.dbService.db,
        payload.driverId
      );
      if (activeTargetBookings.length > 0) {
        throw new BadRequestException("Selected driver already has an active booking");
      }
      updateData.driverId = nextDriver.id;
      nextDriverId = nextDriver.id;
      await setDriverStatus(this.dbService.db, nextDriver.id, "BUSY");
    }

    if (Object.keys(updateData).length > 0) {
      await updateBookingQuery(this.dbService.db, bookingId, updateData);
    }

    if (payload.pickupLocation) {
      await this.dbService.db
        .update(bookings)
        .set({
          pickupLocation: sql`ST_SetSRID(ST_MakePoint(${payload.pickupLocation.x}, ${payload.pickupLocation.y}), 4326)`,
        })
        .where(eq(bookings.id, bookingId));
    }

    if (previousDriverId && nextDriverId && previousDriverId !== nextDriverId) {
      const oldDriverBookings = await getDriverActiveBooking(this.dbService.db, previousDriverId);
      if (oldDriverBookings.length === 0) {
        await setDriverStatus(this.dbService.db, previousDriverId, "AVAILABLE");
      }
      this.socketService.emitToDriver(previousDriverId, "booking:cancelled", {
        bookingId,
        reason: "Reassigned by dispatcher",
      });
    }

    const assignedPayload = await this.buildAssignedBookingPayload(bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException("Failed to build booking payload");
    }

    if (nextDriverId) {
      this.socketService.emitToDriver(nextDriverId, "booking:assigned", assignedPayload);
    }
    if (booking.patientId) {
      this.socketService.emitToPatient(booking.patientId, "booking:assigned", assignedPayload);
    }
    this.socketService.emitToDispatcher(
      payload.dispatcherId,
      "booking:assigned",
      dispatcherPayload
    );

    return {
      bookingId,
      assignedPayload,
      dispatcherPayload,
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

    const [updatedBooking] = await updateBookingQuery(this.dbService.db, bookingId, updateData);

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
    const booking = await getActiveBookingForPatient(this.dbService.db, patientId);

    if (booking.length > 1) {
      console.log(`patient ${patientId} has more than one active bookings`);
    }
    return booking[0];
  }

  async getActiveBookingForDriver(driverId: string) {
    const booking = await getDriverActiveBooking(this.dbService.db, driverId);

    if (booking.length > 1) {
      console.log(`driver ${driverId} has more than one active bookings`);
    }
    return booking[0];
  }

  // TODO: remove
  async getOngoingBookingByUserId(userId: string) {
    const data = await getOngoingBookingByUserId(this.dbService.db, userId);

    if (data.length > 1) {
      console.log("Something is wrong, users cannot have multiple uncompleted bookings");
    }
    return data[0];
  }

  async cancelByPatient(patientId: string, reason: string) {
    const [booking] = await cancelBookingByPatient(this.dbService.db, patientId, reason);

    return booking;
  }

  async askDispatchers(
    nearByDrivers: User[],
    patient: User
  ) {
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
      return { status: "failed" as const, reason: "no_dispatchers" as const };
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
      return { ...winningResponse, status: "approved" as const };
    } catch (_error) {
      console.error("All dispatchers rejected the request");
      return { status: "failed" as const, reason: "all_rejected" as const };
    }
  }

  private async waitForDispatcherApproval(
    dispatcherId: string,
    driver: User,
    patient: User,
    requestId: string
  ) {
    return new Promise<{ dispatcherId: string; pickedDriver: User }>((resolve, reject) => {
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

    const [winner] = await getDispatcherWinnerInfo(this.dbService.db, winnerDispatcherId);

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
    const [booking] = await getOngoingBookingDispatchInfoForDriver(this.dbService.db, driverId);
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

  async getDispatcherActiveBookings(dispatcherId: string) {
    const rows = await getDispatcherActiveBookingRows(this.dbService.db, dispatcherId);

    return rows
      .map((row) => mapDispatcherBookingPayload(row))
      .filter((payload): payload is DispatcherBookingPayload => payload !== null);
  }

  async buildDispatcherBookingPayload(bookingId: string, requestId?: string) {
    const [row] = await getDispatcherBookingPayloadRow(this.dbService.db, bookingId);

    if (!row) return null;

    return mapDispatcherBookingPayload(row, requestId);
  }

  async getBookingLog(providerId?: string, status?: string) {
    return getBookingLogRows(this.dbService.db, providerId, status);
  }

  private async getDispatcherOrThrow(dispatcherId: string) {
    const [dispatcher] = await this.dbService.db
      .select({ id: users.id, providerId: users.providerId, role: users.role })
      .from(users)
      .where(and(eq(users.id, dispatcherId), eq(users.role, "DISPATCHER")));

    if (!dispatcher) {
      throw new NotFoundException("Dispatcher not found");
    }

    if (!dispatcher.providerId) {
      throw new BadRequestException("Dispatcher is not attached to a provider");
    }

    return {
      id: dispatcher.id,
      providerId: dispatcher.providerId,
    };
  }

  private async getDriverForDispatcherOrThrow(driverId: string, providerId: string) {
    const [driver] = await findDriverById(this.dbService.db, driverId);
    if (!driver || !driver.isActive) {
      throw new NotFoundException("Driver not found");
    }

    if (driver.providerId !== providerId) {
      throw new ForbiddenException("Driver provider does not match dispatcher provider");
    }

    return driver;
  }

  private async getHospitalOrThrow(hospitalId: string) {
    const [hospital] = await getHospitalById(this.dbService.db, hospitalId);
    if (!hospital) {
      throw new NotFoundException("Hospital not found");
    }
    return hospital;
  }

  private async resolvePatientForManualAssignment(payload: ManualAssignBookingDto) {
    if (payload.patientId) {
      const [patient] = await findPatientById(this.dbService.db, payload.patientId);
      if (patient) {
        return patient;
      }
    }

    if (payload.patientPhoneNumber) {
      const [existingGuest] = await this.dbService.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, "PATIENT"),
            eq(users.fullName, "Guest"),
            eq(users.phoneNumber, payload.patientPhoneNumber)
          )
        );

      if (existingGuest) {
        return existingGuest;
      }
    }

    const [guest] = await createPatient(this.dbService.db, {
      fullName: "Guest",
      phoneNumber: payload.patientPhoneNumber ?? null,
      email: payload.patientEmail ?? null,
      passwordHash: `guest_${Date.now()}`,
      providerId: null,
      currentLocation: payload.pickupLocation,
    });

    if (!guest) {
      throw new BadRequestException("Failed to create guest patient");
    }

    return guest;
  }
}
