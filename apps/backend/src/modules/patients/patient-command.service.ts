import { Injectable } from "@nestjs/common";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import { BookingService } from "../booking/booking.service";
import { DriverService } from "../drivers/driver.service";
import { HospitalService } from "../hospital/hospital.service";
import { SocketService } from "@/common/socket/socket.service";
import { PatientService } from "./patient.service";

@Injectable()
export class PatientCommandService {
  constructor(
    private patientService: PatientService,
    private driverService: DriverService,
    private bookingService: BookingService,
    private hospitalService: HospitalService,
    private socketService: SocketService
  ) {}

  async requestHelp(patientId: string, data: PatientPickupRequest) {
    const { x, y, patientSettings } = data;
    console.info("[patient] sent settings: ", patientSettings);
    const patient = await this.patientService.findOne(patientId);

    patient.currentLocation = { x, y };
    await this.patientService.updateLocation(patientId, { x, y });

    const nearestDrivers = await this.driverService.findDriverByLocation(y, x);
    if (nearestDrivers.length === 0) {
      this.socketService.emitToPatient(patientId, "booking:failed", { reason: "no_drivers" });
      return;
    }

    const result = await this.bookingService.askDispatchers(nearestDrivers, patient);
    if (result.status === "failed") {
      this.socketService.emitToPatient(patientId, "booking:failed", { reason: result.reason });
      return;
    }

    const { dispatcherId, pickedDriver, requestId } = result;

    const hospital = await this.hospitalService.findTheNearestHospital(y, x);
    const booking = await this.bookingService.createBooking(
      patient,
      y,
      x,
      null,
      hospital,
      pickedDriver,
      null,
      dispatcherId
    );

    const assignedPayload = booking.bookingId
      ? await this.bookingService.buildAssignedBookingPayload(booking.bookingId)
      : null;
    const dispatcherPayload = booking.bookingId
      ? await this.bookingService.buildDispatcherBookingPayload(booking.bookingId, requestId)
      : null;

    if (dispatcherPayload) {
      this.socketService.emitToDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);
    }
    if (assignedPayload) {
      this.socketService.emitToDriver(pickedDriver.id, "booking:assigned", assignedPayload);
      this.socketService.emitToPatient(patientId, "booking:assigned", assignedPayload);
    }
  }

  async cancel(patientId: string, data: PatientCancelRequest = {}) {
    const bookingData = await this.bookingService.getActiveBookingForPatient(patientId);

    if (!bookingData) {
      this.socketService.emitToPatient(patientId, "booking:cancel:error", {
        message: "No active booking to cancel",
      });
      return;
    }

    const cancellationReason = data.reason || "Cancelled by patient";
    await this.bookingService.updateBooking(bookingData.id, {
      status: "CANCELLED",
      cancellationReason,
    });

    if (bookingData.driverId) {
      this.socketService.emitToDriver(bookingData.driverId, "booking:cancelled", {
        bookingId: bookingData.id,
        reason: cancellationReason,
      });
    }

    this.socketService.emitToPatient(patientId, "booking:cancelled", {
      bookingId: bookingData.id,
      message: "Booking cancelled successfully",
    });
  }
}
