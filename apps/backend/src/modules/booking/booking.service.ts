import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { bookings, users } from "@/core/database/schema";
import type { Booking, Hospital, User } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { RealtimeNotifierService } from "@/events/realtime-notifier.service";
import type {
  BookingLogEntry,
  DriverLocationUpdate,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
} from "@ambulink/types";
import { mapAssignedBookingPayload, mapDispatcherBookingPayload } from "@/common/mappers";
import type { ManualAssignBookingDto, ReassignBookingDto } from "@/common/validation/schemas";
import { DispatcherApprovalService } from "../dispatcher/dispatcher-approval.service";
import { BookingRepository } from "./booking.repository";
import { DriverRepository } from "../driver/driver.repository";
import { PatientRepository } from "../patient/patient.repository";
import { HospitalRepository } from "../hospital/hospital.repository";

@Injectable()
export class BookingService {
  constructor(
    private dbService: DbService,
    private dispatcherService: DispatcherService,
    private realtimeNotifier: RealtimeNotifierService,
    private dispatcherApprovalService: DispatcherApprovalService,
    private bookingRepository: BookingRepository,
    private driverRepository: DriverRepository,
    private patientRepository: PatientRepository,
    private hospitalRepository: HospitalRepository
  ) {}

  async createBooking(
    patient: Pick<User, "id">,
    _patientLat: number,
    _patientLng: number,
    pickupAddr: string | null,
    hospital: Pick<Hospital, "id">,
    pickedDriver: Pick<User, "id" | "providerId">,
    emergencyType: string | null,
    dispatcherId?: string | null,
    db: DbExecutor = this.dbService.db
  ) {
    if (!pickedDriver.providerId) {
      throw new BadRequestException("Driver without provider");
    }

    const [createdBooking] = await this.bookingRepository.createBooking({
      patientId: patient.id,
      pickupAddress: pickupAddr,
      pickupLocation: { x: _patientLng, y: _patientLat },
      providerId: pickedDriver.providerId,
      driverId: pickedDriver.id,
      hospitalId: hospital.id,
      dispatcherId: dispatcherId ?? null,
      emergencyType: emergencyType,
      fareEstimate: null,
    }, db);

    return { bookingId: createdBooking?.id ?? null };
  }

  async buildAssignedBookingPayload(bookingId: string) {
    const [row] = await this.bookingRepository.getAssignedBookingPayloadRow(bookingId);
    return mapAssignedBookingPayload(row);
  }

  async manualAssignBooking(dispatcherId: string, payload: ManualAssignBookingDto) {
    const dispatcher = await this.getDispatcherOrThrow(dispatcherId);
    const driver = await this.getDriverForDispatcherOrThrow(
      payload.driverId,
      dispatcher.providerId
    );
    const hospital = await this.getHospitalOrThrow(payload.hospitalId);

    const booking = await this.dbService.db.transaction(async (tx) => {
      const activeDriverBookings = await this.bookingRepository.getDriverActiveBooking(
        payload.driverId,
        tx
      );
      if (activeDriverBookings.length > 0) {
        throw new ConflictException("Selected driver already has an active booking");
      }

      const patient = await this.resolvePatientForManualAssignment(payload, tx);
      const pickupAddress = payload.pickupAddress ?? null;
      const emergencyType = payload.emergencyType ?? null;

      const created = await this.createBooking(
        patient,
        payload.pickupLocation.y,
        payload.pickupLocation.x,
        pickupAddress,
        hospital,
        driver,
        emergencyType,
        dispatcherId,
        tx
      );

      if (!created.bookingId) {
        throw new BadRequestException("Booking creation failed");
      }

      await this.driverRepository.setDriverStatus(driver.id, "BUSY", tx);
      return { bookingId: created.bookingId, patientId: patient.id };
    });

    const assignedPayload = await this.buildAssignedBookingPayload(booking.bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(booking.bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException("Failed to build booking payload");
    }

    this.realtimeNotifier.notifyDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);
    this.realtimeNotifier.notifyDriver(driver.id, "booking:assigned", assignedPayload);
    this.realtimeNotifier.notifyPatient(booking.patientId, "booking:assigned", assignedPayload);

    return {
      bookingId: booking.bookingId,
      assignedPayload,
      dispatcherPayload,
    };
  }

  async reassignBooking(bookingId: string, dispatcherId: string, payload: ReassignBookingDto) {
    const dispatcher = await this.getDispatcherOrThrow(dispatcherId);
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

    if (booking.dispatcherId && booking.dispatcherId !== dispatcherId) {
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

    await this.dbService.db.transaction(async (tx) => {
      if (payload.driverId && payload.driverId !== booking.driverId) {
        const nextDriver = await this.getDriverForDispatcherOrThrow(
          payload.driverId,
          dispatcher.providerId,
          tx
        );
        const activeTargetBookings = await this.bookingRepository.getDriverActiveBooking(
          payload.driverId,
          tx
        );
        if (activeTargetBookings.length > 0) {
          throw new ConflictException("Selected driver already has an active booking");
        }
        updateData.driverId = nextDriver.id;
        nextDriverId = nextDriver.id;
        await this.driverRepository.setDriverStatus(nextDriver.id, "BUSY", tx);
      }

      if (Object.keys(updateData).length > 0) {
        await this.bookingRepository.updateBooking(bookingId, updateData, tx);
      }

      if (payload.pickupLocation) {
        await tx
          .update(bookings)
          .set({
            pickupLocation: sql`ST_SetSRID(ST_MakePoint(${payload.pickupLocation.x}, ${payload.pickupLocation.y}), 4326)`,
          })
          .where(eq(bookings.id, bookingId));
      }

      if (previousDriverId && nextDriverId && previousDriverId !== nextDriverId) {
        const oldDriverBookings = await this.bookingRepository.getDriverActiveBooking(
          previousDriverId,
          tx
        );
        if (oldDriverBookings.length === 0) {
          await this.driverRepository.setDriverStatus(previousDriverId, "AVAILABLE", tx);
        }
      }
    });

    const assignedPayload = await this.buildAssignedBookingPayload(bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException("Failed to build booking payload");
    }

    if (previousDriverId && nextDriverId && previousDriverId !== nextDriverId) {
      this.realtimeNotifier.notifyDriver(previousDriverId, "booking:cancelled", {
        bookingId,
        reason: "Reassigned by dispatcher",
      });
    }

    if (nextDriverId) {
      this.realtimeNotifier.notifyDriver(nextDriverId, "booking:assigned", assignedPayload);
    }
    if (booking.patientId) {
      this.realtimeNotifier.notifyPatient(booking.patientId, "booking:assigned", assignedPayload);
    }
    this.realtimeNotifier.notifyDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);

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

    const [updatedBooking] = await this.bookingRepository.updateBooking(bookingId, updateData);

    if (updatedBooking?.dispatcherId) {
      if (updatedBooking.status === "REQUESTED") {
        return updatedBooking;
      }
      this.realtimeNotifier.notifyDispatcher(updatedBooking.dispatcherId, "booking:update", {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (updatedBooking?.providerId) {
      this.realtimeNotifier.notifyAllDispatchers("booking:log", {
        providerId: updatedBooking.providerId,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    return updatedBooking;
  }

  async getActiveBookingForPatient(patientId: string) {
    const booking = await this.bookingRepository.getActiveBookingForPatient(patientId);
    return booking[0];
  }

  async getActiveBookingForDriver(driverId: string) {
    const booking = await this.bookingRepository.getDriverActiveBooking(driverId);
    return booking[0];
  }

  async cancelByPatient(patientId: string, reason: string) {
    const booking = await this.dbService.db.transaction(async (tx) => {
      const [booking] = await this.bookingRepository.cancelBookingByPatient(patientId, reason, tx);
      if (!booking) {
        return null;
      }

      if (booking.driverId) {
        const remainingDriverBookings = await this.bookingRepository.getDriverActiveBooking(
          booking.driverId,
          tx
        );
        if (remainingDriverBookings.length === 0) {
          await this.driverRepository.setDriverStatus(booking.driverId, "AVAILABLE", tx);
        }
      }

      return booking;
    });

    if (!booking) {
      return null;
    }

    if (booking.dispatcherId) {
      this.realtimeNotifier.notifyDispatcher(booking.dispatcherId, "booking:update", {
        bookingId: booking.id,
        status: "CANCELLED",
        updatedAt: new Date().toISOString(),
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (booking.providerId) {
      this.realtimeNotifier.notifyAllDispatchers("booking:log", {
        providerId: booking.providerId,
        bookingId: booking.id,
        status: booking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    return booking;
  }

  async createApprovedBooking(
    patient: Pick<User, "id">,
    pickup: { x: number; y: number },
    hospital: Pick<Hospital, "id">,
    pickedDriver: Pick<User, "id" | "providerId">,
    dispatcherId: string
  ) {
    return this.dbService.db.transaction(async (tx) => {
      const activeDriverBookings = await this.bookingRepository.getDriverActiveBooking(
        pickedDriver.id,
        tx
      );
      if (activeDriverBookings.length > 0) {
        throw new ConflictException("Selected driver already has an active booking");
      }

      const booking = await this.createBooking(
        patient,
        pickup.y,
        pickup.x,
        null,
        hospital,
        pickedDriver,
        null,
        dispatcherId,
        tx
      );
      if (!booking.bookingId) {
        throw new BadRequestException("Booking creation failed");
      }

      await this.driverRepository.setDriverStatus(pickedDriver.id, "BUSY", tx);
      return booking;
    });
  }

  async askDispatchers(
    nearByDrivers: Pick<User, "id" | "providerId" | "currentLocation">[],
    patient: Pick<User, "id" | "fullName" | "phoneNumber" | "email" | "currentLocation">
  ) {
    console.info("[booking] ask_dispatchers_start", {
      patientId: patient.id,
      nearbyDriverCount: nearByDrivers.length,
      nearbyDriverIds: nearByDrivers.map((driver) => driver.id),
    });

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
      (request): request is {
        dispatcherId: string;
        driver: Pick<User, "id" | "providerId" | "currentLocation">;
        requestId: string;
      } =>
        Boolean(request)
    );

    if (activeRequests.length === 0) {
      console.warn("[booking] ask_dispatchers_failed", {
        patientId: patient.id,
        reason: "no_dispatchers",
        nearbyDriverCount: nearByDrivers.length,
      });
      return { status: "failed" as const, reason: "no_dispatchers" as const };
    }

    const approvalPromises = activeRequests.map(({ dispatcherId, driver, requestId }) =>
      this.dispatcherApprovalService
        .requestApproval(dispatcherId, driver, patient, requestId)
        .then((approved) => {
          if (!approved) {
            throw new BadRequestException("Dispatcher declined or ignored");
          }
          return {
            dispatcherId,
            pickedDriver: driver,
            requestId,
          };
        })
    );

    try {
      const winningResponse = await Promise.any(approvalPromises);
      console.info("[booking] dispatcher_approval_won", {
        patientId: patient.id,
        dispatcherId: winningResponse.dispatcherId,
        driverId: winningResponse.pickedDriver.id,
        requestId: winningResponse.requestId,
      });
      await this.dispatcherApprovalService.notifyDecision(
        activeRequests.map(({ dispatcherId, requestId }) => ({ dispatcherId, requestId })),
        winningResponse.dispatcherId
      );
      return { ...winningResponse, status: "approved" as const };
    } catch (_error) {
      console.warn("[booking] ask_dispatchers_failed", {
        patientId: patient.id,
        reason: "all_rejected",
        activeRequestCount: activeRequests.length,
      });
      return { status: "failed" as const, reason: "all_rejected" as const };
    }
  }

  async sendDriverLocation(driverId: string, data: DriverLocationUpdate) {
    const [booking] = await this.bookingRepository.getOngoingBookingDispatchInfoForDriver(driverId);
    if (!booking) {
      return;
    }
    const { patientId, dispatcherId } = booking;
    if (!patientId || !dispatcherId) {
      return;
    }
    this.realtimeNotifier.notifyDispatcher(dispatcherId, "driver:update", data);
    this.realtimeNotifier.notifyPatient(patientId, "driver:update", data);
  }

  async getDispatcherActiveBookings(dispatcherId: string) {
    const rows = await this.bookingRepository.getDispatcherActiveBookingRows(dispatcherId);

    return rows
      .map((row) => mapDispatcherBookingPayload(row))
      .filter((payload): payload is DispatcherBookingPayload => payload !== null);
  }

  async buildDispatcherBookingPayload(bookingId: string, requestId?: string) {
    const [row] = await this.bookingRepository.getDispatcherBookingPayloadRow(bookingId);

    if (!row) return null;

    return mapDispatcherBookingPayload(row, requestId);
  }

  async getBookingLog(providerId?: string, status?: string): Promise<BookingLogEntry[]> {
    const rows = await this.bookingRepository.getBookingLogRows(providerId, status);
    return rows.map((row) => ({
      ...row,
      requestedAt: row.requestedAt ? row.requestedAt.toISOString() : null,
      assignedAt: row.assignedAt ? row.assignedAt.toISOString() : null,
      arrivedAt: row.arrivedAt ? row.arrivedAt.toISOString() : null,
      pickedupAt: row.pickedupAt ? row.pickedupAt.toISOString() : null,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    }));
  }

  private async getDispatcherOrThrow(dispatcherId: string, db: DbExecutor = this.dbService.db) {
    const [dispatcher] = await db
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

  private async getDriverForDispatcherOrThrow(
    driverId: string,
    providerId: string,
    db: DbExecutor = this.dbService.db
  ) {
    const [driver] = await this.driverRepository.findDriverById(driverId, db);
    if (!driver || !driver.isActive) {
      throw new NotFoundException("Driver not found");
    }

    if (driver.providerId !== providerId) {
      throw new ForbiddenException("Driver provider does not match dispatcher provider");
    }

    return driver;
  }

  private async getHospitalOrThrow(hospitalId: string, db: DbExecutor = this.dbService.db) {
    const [hospital] = await this.hospitalRepository.getHospitalById(hospitalId, db);
    if (!hospital) {
      throw new NotFoundException("Hospital not found");
    }
    return hospital;
  }

  private async resolvePatientForManualAssignment(
    payload: ManualAssignBookingDto,
    db: DbExecutor = this.dbService.db
  ) {
    if (payload.patientId) {
      const [patient] = await this.patientRepository.findPatientById(payload.patientId, db);
      if (patient) {
        return patient;
      }
    }

    if (payload.patientPhoneNumber) {
      const [existingGuest] = await db
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

    const [guest] = await this.patientRepository.createPatient(
      {
        fullName: "Guest",
        phoneNumber: payload.patientPhoneNumber ?? null,
        email: payload.patientEmail ?? null,
        passwordHash: `guest_${Date.now()}`,
        providerId: null,
        currentLocation: payload.pickupLocation,
      },
      db
    );

    if (!guest) {
      throw new BadRequestException("Failed to create guest patient");
    }

    return guest;
  }
}
