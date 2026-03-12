import { Server, Socket } from "socket.io";
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { OnModuleDestroy } from "@nestjs/common";

import { BookingEventsService } from "@/modules/booking/events/booking.events.service";
import { SocketService } from "@/core/socket/socket.service";
import { EventBusService } from "@/core/events/event-bus.service";
import { PatientEventsService } from "./patient.events.service";

@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: "/patient",
})
export class PatientEventsGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer() server: Server;
  private readonly offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private isShuttingDown = false;

  constructor(
    private patientEventsService: PatientEventsService,
    private bookingService: BookingEventsService,
    private socketService: SocketService,
    private eventBus: EventBusService
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
    await this.patientEventsService.updateStatus(patientId, "AVAILABLE");

    const activeBooking = await this.bookingService.getActiveBookingForPatient(patientId);
    if (activeBooking) {
      const bookingPayload = await this.bookingService.buildAssignedBookingPayload(activeBooking.id);
      if (bookingPayload) {
        this.eventBus.publish({
          type: "realtime.patient",
          patientId,
          event: "booking:assigned",
          payload: bookingPayload,
        });
      }
      if (activeBooking.status === "ARRIVED") {
        this.eventBus.publish({
          type: "realtime.patient",
          patientId,
          event: "booking:arrived",
          payload: {
            bookingId: activeBooking.id,
          },
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
    if (this.isShuttingDown) {
      return;
    }
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

    const timer = setTimeout(async () => {
      if (this.isShuttingDown) {
        this.offlineTimers.delete(patientId);
        return;
      }
      try {
        const activeSockets = await this.server.in(`patient:${patientId}`).fetchSockets();
        if (activeSockets.length === 0) {
          await this.patientEventsService.updateStatus(patientId, "OFFLINE");
        }
      } finally {
        this.offlineTimers.delete(patientId);
      }
    }, 10000);

    this.offlineTimers.set(patientId, timer);
  }

  onModuleDestroy() {
    this.isShuttingDown = true;
    for (const timer of this.offlineTimers.values()) {
      clearTimeout(timer);
    }
    this.offlineTimers.clear();
  }
}
