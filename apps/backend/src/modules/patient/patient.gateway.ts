import { Server, Socket } from "socket.io";
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";
import { SocketService } from "@/core/socket/socket.service";

@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: "/patient",
})
export class PatientGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    let patientId: string;
    try {
      patientId = this.extractSocketActorId(client, "patientId");
    } catch {
      console.warn("[socket] missing_auth", {
        namespace: "/patient",
        clientId: client.id,
      });
      return client.disconnect(true);
    }
    client.data.patientId = patientId;
    this.clearPendingOffline(patientId);
    client.join(`patient:${patientId}`);
    await this.patientService.updateStatus(patientId, "AVAILABLE");

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
        this.socketService.emitToPatient(patientId, "booking:arrived", {
          bookingId: activeBooking.id,
        });
      }
    }

    console.log("[socket] connected", {
      namespace: "/patient",
      clientId: client.id,
      patientId,
    });
  }

  private extractSocketActorId(client: Socket, key: "patientId" | "driverId" | "dispatcherId") {
    const authValue = client.handshake.auth?.[key];
    const queryValue = client.handshake.query?.[key];
    const value =
      typeof authValue === "string"
        ? authValue
        : typeof queryValue === "string"
          ? queryValue
          : null;
    if (!value) {
      throw new Error(`${key} is required`);
    }
    return value;
  }

  handleDisconnect(client: Socket) {
    const patientId = client.data.patientId as string | undefined;
    if (patientId) {
      this.scheduleOfflineIfStillDisconnected(patientId);
    }
    console.log("[socket] disconnected", {
      namespace: "/patient",
      clientId: client.id,
      patientId,
    });
  }

  private clearPendingOffline(patientId: string) {
    const timer = this.offlineTimers.get(patientId);
    if (timer) {
      clearTimeout(timer);
      this.offlineTimers.delete(patientId);
    }
  }

  private scheduleOfflineIfStillDisconnected(patientId: string) {
    this.clearPendingOffline(patientId);

    // Keep availability stable through transient reconnects.
    const timer = setTimeout(async () => {
      try {
        const activeSockets = await this.server.in(`patient:${patientId}`).fetchSockets();
        if (activeSockets.length === 0) {
          await this.patientService.updateStatus(patientId, "OFFLINE");
        }
      } finally {
        this.offlineTimers.delete(patientId);
      }
    }, 10000);

    this.offlineTimers.set(patientId, timer);
  }
}
