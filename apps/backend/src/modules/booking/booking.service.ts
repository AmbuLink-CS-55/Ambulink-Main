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
import type {
  BookingAttachment,
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
import { BookingMediaService } from "./booking-media.service";
import type { UploadedMediaFile } from "./booking-media.service";
import { EventBusService } from "@/core/events/event-bus.service";

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
    private eventBus: EventBusService,
    private dispatcherApprovalService: DispatcherApprovalService,
    private bookingRepository: BookingRepository,
    private bookingMediaService: BookingMediaService,
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

    await this.bindPatientDraftUploads(booking.patientId, booking.bookingId);

    const assignedPayload = await this.buildAssignedBookingPayload(booking.bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(booking.bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException(
        bookingError("BOOKING_PAYLOAD_BUILD_FAILED", "Failed to build booking payload")
      );
    }

    this.emitDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);
    this.emitDriver(driver.id, "booking:assigned", assignedPayload);
    this.emitPatient(booking.patientId, "booking:assigned", assignedPayload);

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
      this.emitDriver(previousDriverId, "booking:cancelled", {
        bookingId,
        reason: "Reassigned by dispatcher",
      });
    }

    if (nextDriverId) {
      this.emitDriver(nextDriverId, "booking:assigned", assignedPayload);
    }
    if (booking.patientId) {
      this.emitPatient(
        booking.patientId,
        "booking:assigned",
        assignedPayload
      );
    }
    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.emitEmt(subscriber.emtId, "booking:assigned", assignedPayload);
    }
    this.emitDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);

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
      this.emitDispatcher(updatedBooking.dispatcherId, "booking:update", {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
        providerId: updatedBooking.providerId ?? null,
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (updatedBooking?.providerId) {
      this.emitAllDispatchers("booking:log", {
        providerId: updatedBooking.providerId,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    if (updatedBooking?.patientId && updatedBooking.status === "ARRIVED") {
      this.emitPatient(updatedBooking.patientId, "booking:arrived", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.patientId && updatedBooking.status === "COMPLETED") {
      this.emitPatient(updatedBooking.patientId, "booking:completed", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.driverId && updatedBooking.status === "COMPLETED") {
      this.emitDriver(updatedBooking.driverId, "booking:completed", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.driverId && updatedBooking.status === "CANCELLED") {
      this.emitDriver(updatedBooking.driverId, "booking:cancelled", {
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
          this.emitEmt(emtId, "booking:arrived", {
            bookingId: updatedBooking.id,
          });
        } else if (updatedBooking.status === "COMPLETED") {
          this.emitEmt(emtId, "booking:completed", {
            bookingId: updatedBooking.id,
          });
        } else {
          this.emitEmt(emtId, "booking:cancelled", {
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
      this.emitDispatcher(booking.dispatcherId, "booking:update", {
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
      this.emitAllDispatchers("booking:update", providerUpdatePayload);
      this.emitAllDispatchers("booking:log", {
        providerId: booking.providerId,
        bookingId: booking.id,
        status: booking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    for (const emtId of emtSubscriberIds) {
      this.emitEmt(emtId, "booking:cancelled", {
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
    this.emitDispatcher(dispatcherId, "driver:update", data);
    this.emitPatient(patientId, "driver:update", data);
    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(
      booking.bookingId
    );
    for (const subscriber of emtSubscribers) {
      this.emitEmt(subscriber.emtId, "driver:update", data);
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

  async startPatientUploadSession(patientId: string) {
    await this.getPatientOrThrow(patientId);
    return this.bookingMediaService.startUploadSession(patientId);
  }

  async appendPatientUploadSessionFiles(params: {
    patientId: string;
    sessionId: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    await this.getPatientOrThrow(params.patientId);
    return this.bookingMediaService.appendSessionFiles(params);
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
      type: "TEXT",
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    await this.bookingRepository.appendBookingNote(bookingId, note);

    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(
      dispatcher.providerId
    );
    for (const id of dispatcherIds) {
      this.emitDispatcher(id, "booking:notes", { bookingId, note });
    }

    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.emitEmt(subscriber.emtId, "booking:notes", { bookingId, note });
    }

    if (booking.patientId) {
      this.emitPatient(booking.patientId, "booking:notes", {
        bookingId,
        note,
      });
    }

    return note;
  }

  async addPatientBookingNote(params: {
    bookingId: string;
    patientId: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    const [booking] = await this.bookingRepository.getBookingDetailsRow(params.bookingId);
    if (!booking) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }
    if (booking.patientId !== params.patientId) {
      throw new ForbiddenException(
        bookingError("BOOKING_PATIENT_SCOPE", "Patient cannot access this booking")
      );
    }
    if (!BookingService.ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        bookingError("BOOKING_NOT_ACTIVE", "Patient uploads are only allowed for active bookings")
      );
    }

    const hasContent = Boolean(params.content && params.content.trim().length > 0);
    if (!hasContent && params.files.length === 0) {
      throw new BadRequestException(
        bookingError("BOOKING_NOTE_EMPTY", "Text note or at least one file is required")
      );
    }

    const patient = await this.getPatientOrThrow(params.patientId);
    const note = await this.bookingMediaService.createBookingMediaNote({
      bookingId: params.bookingId,
      authorId: params.patientId,
      authorName: patient.fullName ?? "Patient",
      authorRole: "PATIENT",
      content: params.content ?? "",
      files: params.files,
      durationMs: params.durationMs ?? null,
    });

    await this.bookingRepository.appendBookingNote(params.bookingId, note);
    await this.notifyBookingNoteParticipants(
      params.bookingId,
      note,
      booking.providerId ?? null,
      booking.patientId
    );
    return note;
  }

  async buildEmtMediaNote(params: {
    bookingId: string;
    emtId: string;
    emtName: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    return this.bookingMediaService.createBookingMediaNote({
      bookingId: params.bookingId,
      authorId: params.emtId,
      authorName: params.emtName,
      authorRole: "EMT",
      content: params.content ?? "",
      files: params.files,
      durationMs: params.durationMs ?? null,
    });
  }

  async bindPatientDraftUploads(patientId: string, bookingId: string) {
    const patient = await this.getPatientOrThrow(patientId);
    const notes = await this.bookingMediaService.bindSessionsToBooking({
      patientId,
      bookingId,
      patientName: patient.fullName ?? "Patient",
    });

    if (notes.length === 0) return;
    for (const note of notes) {
      await this.bookingRepository.appendBookingNote(bookingId, note);
    }
  }

  async getAttachmentForActor(
    bookingId: string,
    attachmentId: string,
    actor: { patientId?: string; dispatcherId?: string; emtId?: string }
  ) {
    const [booking] = await this.bookingRepository.getBookingDetailsRow(bookingId);
    if (!booking) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    const notes = this.normalizeBookingNotes(booking.notes, bookingId);
    const attachment = notes
      .flatMap((note) => note.attachments ?? [])
      .find((entry) => entry.id === attachmentId);

    if (!attachment) {
      throw new NotFoundException(bookingError("ATTACHMENT_NOT_FOUND", "Attachment not found"));
    }

    if (actor.patientId) {
      if (booking.patientId !== actor.patientId) {
        throw new ForbiddenException(
          bookingError("BOOKING_PATIENT_SCOPE", "Patient cannot access this booking")
        );
      }
      return this.bookingMediaService.getAttachmentFile(bookingId, attachment);
    }

    if (actor.dispatcherId) {
      const dispatcher = await this.getDispatcherOrThrow(actor.dispatcherId);
      if (!booking.providerId || booking.providerId !== dispatcher.providerId) {
        throw new ForbiddenException(
          bookingError(
            "BOOKING_OUTSIDE_PROVIDER_SCOPE",
            "Dispatcher cannot access booking outside provider scope"
          )
        );
      }
      return this.bookingMediaService.getAttachmentFile(bookingId, attachment);
    }

    if (actor.emtId) {
      const emt = await this.getEmtOrThrow(actor.emtId);
      if (emt.subscribedBookingId !== bookingId) {
        throw new ForbiddenException(
          bookingError("BOOKING_EMT_SCOPE", "EMT can only access subscribed booking attachments")
        );
      }
      if (!booking.providerId || booking.providerId !== emt.providerId) {
        throw new ForbiddenException(
          bookingError("BOOKING_OUTSIDE_PROVIDER_SCOPE", "EMT cannot access outside provider scope")
        );
      }
      return this.bookingMediaService.getAttachmentFile(bookingId, attachment);
    }

    throw new ForbiddenException(bookingError("BOOKING_ACCESS_DENIED", "Access denied"));
  }

  private async notifyBookingNoteParticipants(
    bookingId: string,
    note: BookingNote,
    providerId: string | null,
    patientId?: string | null
  ) {
    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.emitEmt(subscriber.emtId, "booking:notes", { bookingId, note });
    }

    if (patientId) {
      this.emitPatient(patientId, "booking:notes", { bookingId, note });
    }

    if (!providerId) return;
    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(providerId);
    for (const dispatcherId of dispatcherIds) {
      this.emitDispatcher(dispatcherId, "booking:notes", { bookingId, note });
    }
  }

  private emitDispatcher(dispatcherId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.dispatcher",
      dispatcherId,
      event,
      payload,
    });
  }

  private emitAllDispatchers(event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.dispatchers",
      event,
      payload,
    });
  }

  private emitDriver(driverId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.driver",
      driverId,
      event,
      payload,
    });
  }

  private emitPatient(patientId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.patient",
      patientId,
      event,
      payload,
    });
  }

  private emitEmt(emtId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.emt",
      emtId,
      event,
      payload,
    });
  }

  private normalizeBookingNotes(raw: unknown, bookingId: string): BookingNote[] {
    if (!Array.isArray(raw)) return [];

    const normalized: BookingNote[] = [];

    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const note = entry as Partial<BookingNote>;
      if (!note.id || !note.authorId || typeof note.content !== "string" || !note.createdAt) {
        continue;
      }

      const attachments = Array.isArray(note.attachments)
        ? note.attachments.filter((entry): entry is BookingAttachment => {
            if (!entry || typeof entry !== "object") return false;
            const candidate = entry as Partial<BookingAttachment>;
            return Boolean(
              candidate.id &&
              candidate.filename &&
              candidate.mimeType &&
              typeof candidate.sizeBytes === "number" &&
              candidate.kind &&
              candidate.url
            );
          })
        : [];
      const normalizedType = note.type === "MEDIA" || attachments.length > 0 ? "MEDIA" : "TEXT";
      const normalizedRole =
        note.authorRole === "DISPATCHER" || note.authorRole === "PATIENT" ? note.authorRole : "EMT";

      normalized.push({
        id: note.id,
        bookingId: note.bookingId ?? bookingId,
        authorId: note.authorId,
        authorName: note.authorName ?? null,
        authorRole: normalizedRole,
        content: note.content,
        type: normalizedType,
        attachments,
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

  private async getPatientOrThrow(patientId: string, db: DbExecutor = this.dbService.db) {
    const [patient] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.id, patientId), eq(users.role, "PATIENT")));

    if (!patient) {
      throw new NotFoundException(bookingError("PATIENT_NOT_FOUND", "Patient not found"));
    }

    return patient;
  }

  private async getEmtOrThrow(emtId: string, db: DbExecutor = this.dbService.db) {
    const [emt] = await db
      .select({
        id: users.id,
        providerId: users.providerId,
        subscribedBookingId: users.subscribedBookingId,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.id, emtId), eq(users.role, "EMT")));

    if (!emt) {
      throw new NotFoundException(bookingError("EMT_NOT_FOUND", "EMT not found"));
    }

    return emt;
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
