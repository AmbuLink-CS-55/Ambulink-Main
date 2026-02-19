import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { DriverService } from "../drivers/driver.service";
import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";
import { HospitalService } from "../hospital/hospital.service";
import { SocketService } from "@/common/socket/socket.service";
import type { PatientCancelRequest, PatientPickupRequest } from "@/common/types/socket.types";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/patient" })
export class PatientGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(
    private patientService: PatientService,
    private driverService: DriverService,
    private bookingService: BookingService,
    private hospitalService: HospitalService,
    private socketService: SocketService
  ) {}

  afterInit() {
    this.socketService.patientServer = this.server;
    console.log("[socket] gateway_ready", {
      namespace: "/patient",
    });
  }

  async handleConnection(client: Socket) {
    console.log("[socket] connection_attempt", {
      namespace: "/patient",
      clientId: client.id,
    });
    const patientId = client.handshake.auth.patientId as string;
    if (!patientId) {
      console.warn("[socket] missing_auth", {
        namespace: "/patient",
        clientId: client.id,
      });
      return client.disconnect(true);
    }
    client.data.patientId = patientId;
    client.join(`patient:${patientId}`);
    this.patientService.updateStatus(patientId, "AVAILABLE");

    const activeBooking = await this.bookingService.getActiveBookingForPatient(patientId);
    // restate user activity to before when they logged out
    if (activeBooking) {
      const bookingPayload = await this.bookingService.buildAssignedBookingPayload(activeBooking.id);
      if (bookingPayload) {
        client.emit("booking:assigned", bookingPayload);
      }
      if (activeBooking.status === "ARRIVED") {
        client.emit("booking:arrived", { bookingId: activeBooking.id });
      }
    }

    console.log("[socket] connected", {
      namespace: "/patient",
      clientId: client.id,
      patientId,
    });
  }

  @SubscribeMessage("patient:help")
  async findAmbulance(client: Socket, data: PatientPickupRequest) {
    try {
      console.log("help request");
      const { x, y, patientSettings } = data;
      console.info("[patient] sent settings: ", patientSettings);
      const patientId = client.data.patientId;
      const patient = await this.patientService.findOne(patientId);
      patient.currentLocation = { x, y };
      await this.patientService.updateLocation(patientId, { x, y });

      const nearestDrivers = await this.driverService.findDriverByLocation(y, x);
      if (nearestDrivers.length == 0) {
        console.log("No drivers found");
        client.emit("booking:failed", { reason: "no_drivers" });
        return;
      }

      console.log("waiting for dispatcher approval");
      const result = await this.bookingService.askDispatchers(nearestDrivers, patient);
      if (result.status === "failed") {
        client.emit("booking:failed", { reason: result.reason });
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
      console.log("Booking created:", booking);
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
        client.emit("booking:assigned", assignedPayload);
      }
    } catch (error) {
      console.error("[patient] booking request failed", error);
      client.emit("booking:failed", { reason: "error" });
    }
  }

  @SubscribeMessage("patient:cancelled")
  async patientCancel(client: Socket, data?: PatientCancelRequest) {
    try {
      const patientId = client.data.patientId;

      // Get the ongoing booking
      const bookingData = await this.bookingService.getActiveBookingForPatient(patientId);

      if (!bookingData) {
        console.log(`No ongoing booking found for patient ${patientId}`);
        client.emit("booking:cancel:error", {
          message: "No active booking to cancel",
        });
        return;
      }

      // Update booking status to CANCELLED
      const cancellationReason = data?.reason || "Cancelled by patient";
      await this.bookingService.updateBooking(bookingData.id, {
        status: "CANCELLED",
        cancellationReason,
      });

      console.log(`Booking ${bookingData.id} cancelled by patient ${patientId}`);

      // Notify driver if assigned
      if (bookingData.driverId) {
        this.socketService.emitToDriver(bookingData.driverId, "booking:cancelled", {
          bookingId: bookingData.id,
          reason: cancellationReason,
        });
      }

      // TODO: Notify dispatcher about the cancellation
      // We would need to track which dispatcher approved the booking
      // For now, we'll skip this as it requires schema changes

      // Confirm cancellation to patient
      client.emit("booking:cancelled", {
        bookingId: bookingData.id,
        message: "Booking cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      client.emit("booking:cancel:error", {
        message: "Failed to cancel booking. Please try again.",
      });
    }
  }

  handleDisconnect(client: Socket) {
    console.log("[socket] disconnected", {
      namespace: "/patient",
      clientId: client.id,
      patientId: client.data.patientId,
    });
  }
}
