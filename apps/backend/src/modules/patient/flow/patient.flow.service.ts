import { ConflictException, Injectable } from "@nestjs/common";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import { EventBusService } from "@/core/events/event-bus.service";
import { BookingFlowService } from "@/modules/booking/flow/booking.flow.service";
import { DriverFlowService } from "@/modules/driver/flow/driver.flow.service";
import { HospitalFlowService } from "@/modules/hospital/flow/hospital.flow.service";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { PatientFlowRepository } from "./patient.flow.repository";

@Injectable()
export class PatientFlowService {
  constructor(
    private patientRepository: PatientFlowRepository,
    private driverFlowService: DriverFlowService,
    private bookingService: BookingFlowService,
    private hospitalService: HospitalFlowService,
    private eventBus: EventBusService
  ) {}

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

    const nearestDrivers = await this.driverFlowService.findDriverByLocation(y, x);
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

    const result = await this.bookingService.askDispatchers(
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
    const isDriverAvailable = await this.driverFlowService.isAvailable(pickedDriver.id);
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
