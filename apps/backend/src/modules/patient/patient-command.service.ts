import { ConflictException, Injectable } from "@nestjs/common";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import { BookingService } from "../booking/booking.service";
import { DriverService } from "../driver/driver.service";
import { HospitalService } from "../hospital/hospital.service";
import { NotificationService } from "@/core/socket/notification.service";
import { PatientService } from "./patient.service";

@Injectable()
export class PatientCommandService {
  constructor(
    private patientService: PatientService,
    private driverService: DriverService,
    private bookingService: BookingService,
    private hospitalService: HospitalService,
    private notificationService: NotificationService
  ) {}

  async requestHelp(patientId: string, data: PatientPickupRequest) {
    const { x, y, patientSettings } = data;
    console.info("[patient] sent settings: ", patientSettings);
    console.info("[patient] request_help_start", { patientId, x, y });

    const activeBooking = await this.bookingService.getActiveBookingForPatient(patientId);
    if (activeBooking) {
      throw new ConflictException("Patient already has an active booking");
    }

    const patient = await this.patientService.findOne(patientId);

    patient.currentLocation = { x, y };
    await this.patientService.updateLocation(patientId, { x, y });

    const nearestDrivers = await this.driverService.findDriverByLocation(y, x);
    if (nearestDrivers.length === 0) {
      console.warn("[patient] booking_failed", {
        patientId,
        reason: "no_drivers",
        stage: "nearby_search",
      });
      this.notificationService.notifyPatient(patientId, "booking:failed", {
        reason: "no drivers near patient",
      });
      return;
    }
    console.info("[patient] nearby_drivers_found", {
      patientId,
      count: nearestDrivers.length,
      driverIds: nearestDrivers.map((driver) => driver.id),
    });

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
      console.warn("[patient] booking_failed", {
        patientId,
        reason: result.reason,
        stage: "dispatcher_approval",
      });
      this.notificationService.notifyPatient(patientId, "booking:failed", {
        reason: result.reason,
      });
      return;
    }

    const { dispatcherId, pickedDriver, requestId } = result;
    const isDriverAvailable = await this.driverService.isAvailable(pickedDriver.id);
    if (!isDriverAvailable) {
      console.warn("[patient] booking_failed", {
        patientId,
        reason: "no_drivers",
        stage: "post_approval_driver_availability_check",
        pickedDriverId: pickedDriver.id,
        dispatcherId,
        requestId,
      });
      this.notificationService.notifyPatient(patientId, "booking:failed", { reason: "no_drivers" });
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

    const assignedPayload = booking.bookingId
      ? await this.bookingService.buildAssignedBookingPayload(booking.bookingId)
      : null;
    const dispatcherPayload = booking.bookingId
      ? await this.bookingService.buildDispatcherBookingPayload(booking.bookingId, requestId)
      : null;

    if (dispatcherPayload) {
      this.notificationService.notifyDispatcher(
        dispatcherId,
        "booking:assigned",
        dispatcherPayload
      );
    }
    if (assignedPayload) {
      this.notificationService.notifyDriver(pickedDriver.id, "booking:assigned", assignedPayload);
      this.notificationService.notifyPatient(patientId, "booking:assigned", assignedPayload);
      console.info("[patient] booking_assigned", {
        patientId,
        bookingId: assignedPayload.bookingId,
        dispatcherId,
        driverId: pickedDriver.id,
      });
    }
  }

  async cancel(patientId: string, data: PatientCancelRequest = {}) {
    const cancellationReason = data.reason || "Cancelled by patient";
    const bookingData = await this.bookingService.cancelByPatient(patientId, cancellationReason);

    if (!bookingData) {
      this.notificationService.notifyPatient(patientId, "booking:cancel:error", {
        message: "No active booking to cancel",
      });
      return;
    }

    if (bookingData.driverId) {
      this.notificationService.notifyDriver(bookingData.driverId, "booking:cancelled", {
        bookingId: bookingData.id,
        reason: cancellationReason,
      });
    }

    this.notificationService.notifyPatient(patientId, "booking:cancelled", {
      bookingId: bookingData.id,
      message: "Booking cancelled successfully",
    });
  }
}
