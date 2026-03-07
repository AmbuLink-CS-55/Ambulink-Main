import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { bookings, users } from "@/core/database/schema";
import type { Booking, Hospital, User } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { NotificationService } from "@/core/socket/notification.service";
import type {
  BookingDetailsPayload,
  BookingLogEntry,
  BookingNote,
  BookingStatus,
  DriverLocationUpdate,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
  EmtNote,
  PatientSettingsData,
} from "@ambulink/types";
import { mapAssignedBookingPayload, mapDispatcherBookingPayload } from "@/common/mappers";
import type { ManualAssignBookingDto, ReassignBookingDto } from "@/common/validation/schemas";
import { DispatcherApprovalService } from "../dispatcher/dispatcher-approval.service";
import { BookingRepository } from "./booking.repository";
import { DriverRepository } from "../driver/driver.repository";
import { PatientRepository } from "../patient/patient.repository";
import { HospitalRepository } from "../hospital/hospital.repository";

const bookingError = (code: string, message: string) => ({ code, message });

@Injectable()
export class BookingService {
  private static readonly ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
    "ASSIGNED",
    "ARRIVED",
    "PICKEDUP",
  ];

  constructor(
    private dbService: DbService,
    private dispatcherService: DispatcherService,
    private notificationService: NotificationService,
    private dispatcherApprovalService: DispatcherApprovalService,
    private bookingRepository: BookingRepository,
    private driverRepository: DriverRepository,
    private patientRepository: PatientRepository,
    private hospitalRepository: HospitalRepository
  ) {}

  async createBooking(
    patient: { id: string },
    _patientLat: number,
    _patientLng: number,
    pickupAddr: string | null,
    hospital: Pick<Hospital, "id">,
    pickedDriver: Pick<User, "id" | "providerId">,
    emergencyType: string | null,
    patientProfileSnapshot: PatientSettingsData | null,
    dispatcherId?: string | null,
    db: DbExecutor = this.dbService.db
  ) {
    if (!pickedDriver.providerId) {
      throw new BadRequestException(
        bookingError("BOOKING_DRIVER_WITHOUT_PROVIDER", "Driver without provider")
      );
    }

    const [createdBooking] = await this.bookingRepository.createBooking(
      {
        patientId: patient.id,
        pickupAddress: pickupAddr,
        pickupLocation: { x: _patientLng, y: _patientLat },
        providerId: pickedDriver.providerId,
        driverId: pickedDriver.id,
        hospitalId: hospital.id,
        dispatcherId: dispatcherId ?? null,
        emergencyType: emergencyType,
        patientProfileSnapshot,
        fareEstimate: null,
      },
      db
    );

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
        throw new ConflictException(
          bookingError("BOOKING_DRIVER_BUSY", "Selected driver already has an active booking")
        );
      }

      const patient = await this.resolvePatientForManualAssignment(payload, tx);
      const pickupAddress = payload.pickupAddress ?? null;
      const emergencyType = payload.emergencyType ?? null;

      const created = await this.createBooking(
        { id: patient.id },
        payload.pickupLocation.y,
        payload.pickupLocation.x,
        pickupAddress,
        hospital,
        driver,
        emergencyType,
        null,
        dispatcherId,
        tx
      );

      if (!created.bookingId) {
        throw new BadRequestException(
          bookingError("BOOKING_CREATION_FAILED", "Booking creation failed")
        );
      }

      await this.bookingRepository.setUserSubscribedBooking(patient.id, created.bookingId, tx);
      await this.bookingRepository.setUserSubscribedBooking(driver.id, created.bookingId, tx);
      await this.driverRepository.setDriverStatus(driver.id, "BUSY", tx);
      return { bookingId: created.bookingId, patientId: patient.id };
    });

    const assignedPayload = await this.buildAssignedBookingPayload(booking.bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(booking.bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException(
        bookingError("BOOKING_PAYLOAD_BUILD_FAILED", "Failed to build booking payload")
      );
    }

    this.notificationService.notifyDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);
    this.notificationService.notifyDriver(driver.id, "booking:assigned", assignedPayload);
    this.notificationService.notifyPatient(booking.patientId, "booking:assigned", assignedPayload);

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
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    if (!booking.providerId || booking.providerId !== dispatcher.providerId) {
      throw new ForbiddenException(
        bookingError(
          "BOOKING_OUTSIDE_PROVIDER_SCOPE",
          "Dispatcher cannot reassign booking outside provider scope"
        )
      );
    }

    if (booking.dispatcherId && booking.dispatcherId !== dispatcherId) {
      throw new ForbiddenException(
        bookingError(
          "BOOKING_ASSIGNED_TO_ANOTHER_DISPATCHER",
          "Only the assigned dispatcher can reassign this booking"
        )
      );
    }

    if (!BookingService.ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        bookingError("BOOKING_NOT_ACTIVE", "Only active bookings can be reassigned")
      );
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
          throw new ConflictException(
            bookingError("BOOKING_DRIVER_BUSY", "Selected driver already has an active booking")
          );
        }
        updateData.driverId = nextDriver.id;
        nextDriverId = nextDriver.id;
        await this.bookingRepository.setUserSubscribedBooking(nextDriver.id, bookingId, tx);
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
          await this.bookingRepository.clearUserSubscribedBooking(previousDriverId, tx);
          await this.driverRepository.setDriverStatus(previousDriverId, "AVAILABLE", tx);
        }
      }
    });

    const assignedPayload = await this.buildAssignedBookingPayload(bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException(
        bookingError("BOOKING_PAYLOAD_BUILD_FAILED", "Failed to build booking payload")
      );
    }

    if (previousDriverId && nextDriverId && previousDriverId !== nextDriverId) {
      this.notificationService.notifyDriver(previousDriverId, "booking:cancelled", {
        bookingId,
        reason: "Reassigned by dispatcher",
      });
    }

    if (nextDriverId) {
      this.notificationService.notifyDriver(nextDriverId, "booking:assigned", assignedPayload);
    }
    if (booking.patientId) {
      this.notificationService.notifyPatient(
        booking.patientId,
        "booking:assigned",
        assignedPayload
      );
    }
    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.notificationService.notifyEmt(subscriber.emtId, "booking:assigned", assignedPayload);
    }
    this.notificationService.notifyDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);

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

    const { updatedBooking, emtSubscriberIds } = await this.dbService.db.transaction(async (tx) => {
      const [record] = await this.bookingRepository.updateBooking(bookingId, updateData, tx);
      if (!record) {
        return { updatedBooking: undefined, emtSubscriberIds: [] as string[] };
      }

      const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(record.id, tx);

      if (record.status === "COMPLETED" || record.status === "CANCELLED") {
        await this.bookingRepository.clearSubscribedBookingForBooking(record.id, tx);
      }

      return {
        updatedBooking: record,
        emtSubscriberIds: emtSubscribers.map((subscriber) => subscriber.emtId),
      };
    });

    if (updatedBooking?.dispatcherId) {
      if (updatedBooking.status === "REQUESTED") {
        return updatedBooking;
      }
      this.notificationService.notifyDispatcher(updatedBooking.dispatcherId, "booking:update", {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
        providerId: updatedBooking.providerId ?? null,
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (updatedBooking?.providerId) {
      this.notificationService.notifyAllDispatchers("booking:log", {
        providerId: updatedBooking.providerId,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    if (updatedBooking?.patientId && updatedBooking.status === "ARRIVED") {
      this.notificationService.notifyPatient(updatedBooking.patientId, "booking:arrived", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.patientId && updatedBooking.status === "COMPLETED") {
      this.notificationService.notifyPatient(updatedBooking.patientId, "booking:completed", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.driverId && updatedBooking.status === "COMPLETED") {
      this.notificationService.notifyDriver(updatedBooking.driverId, "booking:completed", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.driverId && updatedBooking.status === "CANCELLED") {
      this.notificationService.notifyDriver(updatedBooking.driverId, "booking:cancelled", {
        bookingId: updatedBooking.id,
        reason: updatedBooking.cancellationReason ?? "Booking cancelled",
      });
    }

    if (
      updatedBooking?.status === "ARRIVED" ||
      updatedBooking?.status === "COMPLETED" ||
      updatedBooking?.status === "CANCELLED"
    ) {
      for (const emtId of emtSubscriberIds) {
        if (updatedBooking.status === "ARRIVED") {
          this.notificationService.notifyEmt(emtId, "booking:arrived", {
            bookingId: updatedBooking.id,
          });
        } else if (updatedBooking.status === "COMPLETED") {
          this.notificationService.notifyEmt(emtId, "booking:completed", {
            bookingId: updatedBooking.id,
          });
        } else {
          this.notificationService.notifyEmt(emtId, "booking:cancelled", {
            bookingId: updatedBooking.id,
            reason: updatedBooking.cancellationReason ?? "Booking cancelled",
          });
        }
      }
    }

    return updatedBooking;
  }

  async getActiveBookingForPatient(patientId: string) {
    const [subscription] = await this.bookingRepository.getUserSubscribedBooking(patientId);
    if (subscription?.subscribedBookingId) {
      const [subscribedBooking] = await this.bookingRepository.getActiveBookingById(
        subscription.subscribedBookingId
      );
      if (subscribedBooking) {
        return subscribedBooking;
      }
    }

    const booking = await this.bookingRepository.getActiveBookingForPatient(patientId);
    return booking[0];
  }

  async getActiveBookingForDriver(driverId: string) {
    const [subscription] = await this.bookingRepository.getUserSubscribedBooking(driverId);
    if (subscription?.subscribedBookingId) {
      const [subscribedBooking] = await this.bookingRepository.getActiveBookingById(
        subscription.subscribedBookingId
      );
      if (subscribedBooking) {
        return subscribedBooking;
      }
    }

    const booking = await this.bookingRepository.getDriverActiveBooking(driverId);
    return booking[0];
  }

  async cancelByPatient(patientId: string, reason: string) {
    const { booking, emtSubscriberIds } = await this.dbService.db.transaction(async (tx) => {
      const [booking] = await this.bookingRepository.cancelBookingByPatient(patientId, reason, tx);
      if (!booking) {
        return { booking: null, emtSubscriberIds: [] as string[] };
      }

      const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(
        booking.id,
        tx
      );
      await this.bookingRepository.clearSubscribedBookingForBooking(booking.id, tx);

      if (booking.driverId) {
        const remainingDriverBookings = await this.bookingRepository.getDriverActiveBooking(
          booking.driverId,
          tx
        );
        if (remainingDriverBookings.length === 0) {
          await this.driverRepository.setDriverStatus(booking.driverId, "AVAILABLE", tx);
        }
      }

      return {
        booking,
        emtSubscriberIds: emtSubscribers.map((subscriber) => subscriber.emtId),
      };
    });

    if (!booking) {
      return null;
    }

    if (booking.dispatcherId) {
      this.notificationService.notifyDispatcher(booking.dispatcherId, "booking:update", {
        bookingId: booking.id,
        status: "CANCELLED",
        updatedAt: new Date().toISOString(),
        providerId: booking.providerId ?? null,
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (booking.providerId) {
      const providerUpdatePayload = {
        bookingId: booking.id,
        status: "CANCELLED" as const,
        updatedAt: new Date().toISOString(),
        providerId: booking.providerId,
      } satisfies DispatcherBookingUpdatePayload;
      this.notificationService.notifyAllDispatchers("booking:update", providerUpdatePayload);
      this.notificationService.notifyAllDispatchers("booking:log", {
        providerId: booking.providerId,
        bookingId: booking.id,
        status: booking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    for (const emtId of emtSubscriberIds) {
      this.notificationService.notifyEmt(emtId, "booking:cancelled", {
        bookingId: booking.id,
        reason,
      });
    }

    return booking;
  }

  async createApprovedBooking(
    patient: { id: string },
    pickup: { x: number; y: number },
    hospital: Pick<Hospital, "id">,
    pickedDriver: Pick<User, "id" | "providerId">,
    dispatcherId: string,
    patientProfileSnapshot: PatientSettingsData | null
  ) {
    return this.dbService.db.transaction(async (tx) => {
      const activeDriverBookings = await this.bookingRepository.getDriverActiveBooking(
        pickedDriver.id,
        tx
      );
      if (activeDriverBookings.length > 0) {
        throw new ConflictException(
          bookingError("BOOKING_DRIVER_BUSY", "Selected driver already has an active booking")
        );
      }

      const booking = await this.createBooking(
        patient,
        pickup.y,
        pickup.x,
        null,
        hospital,
        pickedDriver,
        null,
        patientProfileSnapshot,
        dispatcherId,
        tx
      );
      if (!booking.bookingId) {
        throw new BadRequestException(
          bookingError("BOOKING_CREATION_FAILED", "Booking creation failed")
        );
      }

      await this.bookingRepository.setUserSubscribedBooking(patient.id, booking.bookingId, tx);
      await this.bookingRepository.setUserSubscribedBooking(pickedDriver.id, booking.bookingId, tx);
      await this.driverRepository.setDriverStatus(pickedDriver.id, "BUSY", tx);
      return booking;
    });
  }

  async askDispatchers(
    nearByDrivers: Array<{
      id: string;
      providerId: string | null;
      currentLocation: User["currentLocation"];
    }>,
    patient: {
      id: string;
      fullName: string | null;
      phoneNumber: string | null;
      email: string | null;
      currentLocation: User["currentLocation"];
    }
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
      (
        request
      ): request is {
        dispatcherId: string;
        driver: {
          id: string;
          providerId: string | null;
          currentLocation: User["currentLocation"];
        };
        requestId: string;
      } => Boolean(request)
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
            throw new BadRequestException(
              bookingError("BOOKING_DISPATCHER_DECLINED", "Dispatcher declined or ignored")
            );
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
    this.notificationService.notifyDispatcher(dispatcherId, "driver:update", data);
    this.notificationService.notifyPatient(patientId, "driver:update", data);
    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(
      booking.bookingId
    );
    for (const subscriber of emtSubscribers) {
      this.notificationService.notifyEmt(subscriber.emtId, "driver:update", data);
    }
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

  async getActiveBookingById(bookingId: string) {
    const [booking] = await this.bookingRepository.getActiveBookingById(bookingId);
    return booking;
  }

  async getUserSubscribedBooking(userId: string) {
    const [subscription] = await this.bookingRepository.getUserSubscribedBooking(userId);
    if (!subscription?.subscribedBookingId) {
      return null;
    }

    const [booking] = await this.bookingRepository.getActiveBookingById(
      subscription.subscribedBookingId
    );
    return booking ?? null;
  }

  async setUserSubscribedBooking(userId: string, bookingId: string) {
    await this.bookingRepository.setUserSubscribedBooking(userId, bookingId);
  }

  async searchOngoingBookingsByProvider(providerId: string, query: string, limit?: number) {
    return this.bookingRepository.searchOngoingBookingsByProvider(providerId, query, limit);
  }

  async getEmtSubscribersForBooking(bookingId: string) {
    return this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
  }

  async appendBookingNote(bookingId: string, note: BookingNote) {
    const [updated] = await this.bookingRepository.appendBookingNote(bookingId, note);
    return updated;
  }

  async appendEmtNote(bookingId: string, note: EmtNote) {
    const [updated] = await this.bookingRepository.appendEmtNote(bookingId, note);
    return updated;
  }

  async getBookingDetailsForDispatcher(bookingId: string, dispatcherId: string) {
    const dispatcher = await this.getDispatcherOrThrow(dispatcherId);
    const [row] = await this.bookingRepository.getBookingDetailsRow(bookingId);
    if (!row) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    if (!row.providerId || row.providerId !== dispatcher.providerId) {
      throw new ForbiddenException(
        bookingError(
          "BOOKING_OUTSIDE_PROVIDER_SCOPE",
          "Dispatcher cannot access booking outside provider scope"
        )
      );
    }

    return {
      bookingId: row.bookingId,
      status: row.status,
      requestedAt: row.requestedAt ? row.requestedAt.toISOString() : null,
      assignedAt: row.assignedAt ? row.assignedAt.toISOString() : null,
      arrivedAt: row.arrivedAt ? row.arrivedAt.toISOString() : null,
      pickedupAt: row.pickedupAt ? row.pickedupAt.toISOString() : null,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      cancellationReason: row.cancellationReason ?? null,
      patient: {
        id: row.patientId ?? null,
        fullName: row.patientName ?? null,
        phoneNumber: row.patientPhone ?? null,
      },
      driver: {
        id: row.driverId ?? null,
        fullName: row.driverName ?? null,
        phoneNumber: row.driverPhone ?? null,
      },
      hospital: {
        id: row.hospitalId ?? null,
        name: row.hospitalName ?? null,
        phoneNumber: row.hospitalPhone ?? null,
      },
      provider: {
        id: row.providerId ?? null,
        name: row.providerName ?? null,
      },
      notes: this.normalizeBookingNotes(row.notes, row.bookingId),
    } satisfies BookingDetailsPayload;
  }

  async addDispatcherNote(bookingId: string, dispatcherId: string, content: string) {
    const dispatcher = await this.getDispatcherOrThrow(dispatcherId);
    const [booking] = await this.bookingRepository.getBookingDetailsRow(bookingId);
    if (!booking) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    if (!booking.providerId || booking.providerId !== dispatcher.providerId) {
      throw new ForbiddenException(
        bookingError(
          "BOOKING_OUTSIDE_PROVIDER_SCOPE",
          "Dispatcher cannot access booking outside provider scope"
        )
      );
    }
    if (!BookingService.ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        bookingError("BOOKING_NOT_ACTIVE", "Dispatcher notes are only allowed for active bookings")
      );
    }

    const note: BookingNote = {
      id: randomUUID(),
      bookingId,
      authorId: dispatcherId,
      authorName: dispatcher.fullName ?? "Dispatcher",
      authorRole: "DISPATCHER",
      content,
      createdAt: new Date().toISOString(),
    };

    await this.bookingRepository.appendBookingNote(bookingId, note);

    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(
      dispatcher.providerId
    );
    for (const id of dispatcherIds) {
      this.notificationService.notifyDispatcher(id, "booking:notes", { bookingId, note });
    }

    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.notificationService.notifyEmt(subscriber.emtId, "booking:notes", { bookingId, note });
    }

    return note;
  }

  private normalizeBookingNotes(raw: unknown, bookingId: string): BookingNote[] {
    if (!Array.isArray(raw)) return [];

    const normalized: BookingNote[] = [];

    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const note = entry as Partial<BookingNote>;
      if (!note.id || !note.authorId || !note.content || !note.createdAt) continue;

      normalized.push({
        id: note.id,
        bookingId: note.bookingId ?? bookingId,
        authorId: note.authorId,
        authorName: note.authorName ?? null,
        authorRole: note.authorRole ?? "EMT",
        content: note.content,
        createdAt: note.createdAt,
      });
    }

    return normalized.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private async getDispatcherOrThrow(dispatcherId: string, db: DbExecutor = this.dbService.db) {
    const [dispatcher] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        providerId: users.providerId,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.id, dispatcherId), eq(users.role, "DISPATCHER")));

    if (!dispatcher) {
      throw new NotFoundException(bookingError("DISPATCHER_NOT_FOUND", "Dispatcher not found"));
    }

    if (!dispatcher.providerId) {
      throw new BadRequestException(
        bookingError("DISPATCHER_PROVIDER_MISSING", "Dispatcher is not attached to a provider")
      );
    }

    return {
      id: dispatcher.id,
      fullName: dispatcher.fullName,
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
      throw new NotFoundException(bookingError("DRIVER_NOT_FOUND", "Driver not found"));
    }

    if (driver.providerId !== providerId) {
      throw new ForbiddenException(
        bookingError(
          "DRIVER_PROVIDER_MISMATCH",
          "Driver provider does not match dispatcher provider"
        )
      );
    }

    return driver;
  }

  private async getHospitalOrThrow(hospitalId: string, db: DbExecutor = this.dbService.db) {
    const [hospital] = await this.hospitalRepository.getHospitalById(hospitalId, db);
    if (!hospital) {
      throw new NotFoundException(bookingError("HOSPITAL_NOT_FOUND", "Hospital not found"));
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
      throw new BadRequestException(
        bookingError("GUEST_PATIENT_CREATE_FAILED", "Failed to create guest patient")
      );
    }

    return guest;
  }
}
