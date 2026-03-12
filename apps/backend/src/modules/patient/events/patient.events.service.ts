import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import { EventBusService } from "@/core/events/event-bus.service";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { users } from "@/core/database/schema";
import { BookingEventsService } from "@/modules/booking/events/booking.events.service";
import { DriverEventsService } from "@/modules/driver/events/driver.events.service";
import { HospitalEventsService } from "@/modules/hospital/events/hospital.events.service";
import { DispatcherEventsApprovalService } from "@/modules/dispatcher/events/dispatcher.events-approval.service";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import type { ManualAssignBookingDto } from "@/common/validation/schemas";
import { PatientEventsRepository } from "./patient.events.repository";

@Injectable()
export class PatientEventsService {
  constructor(
    private patientRepository: PatientEventsRepository,
    private driverEventsService: DriverEventsService,
    @Inject(forwardRef(() => BookingEventsService))
    private bookingService: BookingEventsService,
    private hospitalService: HospitalEventsService,
    private dispatcherApprovalService: DispatcherEventsApprovalService,
    private dbService: DbService,
    private eventBus: EventBusService
  ) {}

  async getPatientOrThrow(patientId: string, db: DbExecutor = this.dbService.db) {
    const [patient] = await this.patientRepository.findPatientById(patientId, db);
    if (!patient) {
      throw new NotFoundException({ code: "PATIENT_NOT_FOUND", message: "Patient not found" });
    }
    return patient;
  }

  assertBookingPatientScope(bookingPatientId: string | null, patientId: string) {
    if (bookingPatientId !== patientId) {
      throw new ForbiddenException({
        code: "BOOKING_PATIENT_SCOPE",
        message: "Patient cannot access this booking",
      });
    }
  }

  async resolveOrCreateManualAssignmentPatient(
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
      throw new ConflictException({
        code: "GUEST_PATIENT_CREATE_FAILED",
        message: "Failed to create guest patient",
      });
    }

    return guest;
  }

  async updateStatus(patientId: string, status: "AVAILABLE" | "OFFLINE") {
    return this.patientRepository.updateUserStatus(patientId, status);
  }

  async updateLocation(patientId: string, location: { x: number; y: number }) {
    return this.patientRepository.updateUserLocation(patientId, location);
  }

  async findOne(patientId: string) {
    const [patient] = await this.patientRepository.findPatientById(patientId);
    return patient ?? null;
  }

  async requestHelp(patientId: string, data: PatientPickupRequest) {
    const { x, y, patientSettings } = data;
    const activeBooking = await this.bookingService.getActiveBookingForPatient(patientId);
    if (activeBooking) {
      throw new ConflictException("Patient already has an active booking");
    }

    const patient = await this.findOne(patientId);
    if (!patient) {
      throw new ConflictException("Patient not found");
    }

    patient.currentLocation = { x, y };
    await this.updateLocation(patientId, { x, y });

    const nearestDrivers = await this.driverEventsService.findDriverByLocation(y, x);
    if (nearestDrivers.length === 0) {
      this.eventBus.publish({
        type: "realtime.patient",
        patientId,
        event: "booking:failed",
        payload: {
          reason: "no drivers near patient",
        },
      });
      return;
    }

    const result = await this.dispatcherApprovalService.pickDriverThroughDispatchers(
      nearestDrivers as Array<{
        id: string;
        providerId: string | null;
        currentLocation: { x: number; y: number } | null;
      }>,
      patient as {
        id: string;
        fullName: string | null;
        phoneNumber: string | null;
        email: string | null;
        currentLocation: { x: number; y: number } | null;
      }
    );
    if (result.status === "failed") {
      this.eventBus.publish({
        type: "realtime.patient",
        patientId,
        event: "booking:failed",
        payload: {
          reason: result.reason,
        },
      });
      return;
    }

    const { dispatcherId, pickedDriver, requestId } = result;
    const isDriverAvailable = await this.driverEventsService.isAvailable(pickedDriver.id);
    if (!isDriverAvailable) {
      this.eventBus.publish({
        type: "realtime.patient",
        patientId,
        event: "booking:failed",
        payload: { reason: "no_drivers" },
      });
      return;
    }

    const hospital = await this.hospitalService.findTheNearestHospital(y, x);
    const booking = await this.bookingService.createApprovedBooking(
      patient,
      { x, y },
      hospital,
      pickedDriver,
      dispatcherId,
      patientSettings
    );

    if (booking.bookingId) {
      await this.bookingService.bindPatientDraftUploads(patientId, booking.bookingId);
    }

    const assignedPayload = booking.bookingId
      ? await this.bookingService.buildAssignedBookingPayload(booking.bookingId)
      : null;
    const dispatcherPayload = booking.bookingId
      ? await this.bookingService.buildDispatcherBookingPayload(booking.bookingId, requestId)
      : null;

    if (dispatcherPayload) {
      this.eventBus.publish({
        type: "realtime.dispatcher",
        dispatcherId,
        event: "booking:assigned",
        payload: dispatcherPayload,
      });
    }
    if (assignedPayload) {
      this.eventBus.publish({
        type: "realtime.driver",
        driverId: pickedDriver.id,
        event: "booking:assigned",
        payload: assignedPayload,
      });
      this.eventBus.publish({
        type: "realtime.patient",
        patientId,
        event: "booking:assigned",
        payload: assignedPayload,
      });
    }
  }

  async cancel(patientId: string, data: PatientCancelRequest = {}) {
    const cancellationReason = data.reason || "Cancelled by patient";
    const bookingData = await this.bookingService.cancelByPatient(patientId, cancellationReason);

    if (!bookingData) {
      this.eventBus.publish({
        type: "realtime.patient",
        patientId,
        event: "booking:cancel:error",
        payload: {
          message: "No active booking to cancel",
        },
      });
      return;
    }

    if (bookingData.driverId) {
      this.eventBus.publish({
        type: "realtime.driver",
        driverId: bookingData.driverId,
        event: "booking:cancelled",
        payload: {
          bookingId: bookingData.id,
          reason: cancellationReason,
        },
      });
    }

    this.eventBus.publish({
      type: "realtime.patient",
      patientId,
      event: "booking:cancelled",
      payload: {
        bookingId: bookingData.id,
        message: "Booking cancelled successfully",
      },
    });
  }

  async startUploadSession(patientId: string) {
    return this.bookingService.startPatientUploadSession(patientId);
  }

  async uploadSessionFiles(params: {
    patientId: string;
    sessionId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.bookingService.appendPatientUploadSessionFiles({
      patientId: params.patientId,
      sessionId: params.sessionId,
      content: params.content,
      files: params.files,
      durationMs: params.durationMs,
    });
  }

  async addBookingNote(params: {
    bookingId: string;
    patientId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.bookingService.addPatientBookingNote({
      bookingId: params.bookingId,
      patientId: params.patientId,
      content: params.content,
      files: params.files,
      durationMs: params.durationMs,
    });
  }
}
