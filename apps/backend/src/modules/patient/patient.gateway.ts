import { Server, Socket } from "socket.io";
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";
import { SocketService } from "@/core/socket/socket.service";
import { TokenService } from "@/core/auth/token.service";
import { authenticateSocket } from "@/core/auth/ws-auth";
import env from "../../../env";

const gatewayCorsOrigins = [
  env.FRONTEND_URL,
  ...(env.FRONTEND_URLS?.split(",").map((origin) => origin.trim()) ?? []),
].filter((origin): origin is string => Boolean(origin));

@WebSocketGateway({
  cors: {
    origin:
      gatewayCorsOrigins.length > 0 ? gatewayCorsOrigins : env.APP_STAGE === "dev" ? true : false,
  },
  namespace: "/patient",
})
export class PatientGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private patientService: PatientService,
    private bookingService: BookingService,
    private socketService: SocketService,
    private tokenService: TokenService
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
      const user = authenticateSocket(client, this.tokenService, ["PATIENT"]);
      patientId = user.sub;
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
