import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";
import { SocketService } from "@/common/socket/socket.service";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/patient" })
export class PatientGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(
    private patientService: PatientService,
    private bookingService: BookingService,
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
      const bookingPayload = await this.bookingService.buildAssignedBookingPayload(
        activeBooking.id
      );
      if (bookingPayload) {
        this.socketService.emitToPatient(patientId, "booking:assigned", bookingPayload);
      }
      if (activeBooking.status === "ARRIVED") {
        this.socketService.emitToPatient(patientId, "booking:arrived", { bookingId: activeBooking.id });
      }
    }

    console.log("[socket] connected", {
      namespace: "/patient",
      clientId: client.id,
      patientId,
    });
  }

  handleDisconnect(client: Socket) {
    console.log("[socket] disconnected", {
      namespace: "/patient",
      clientId: client.id,
      patientId: client.data.patientId,
    });
  }
}
