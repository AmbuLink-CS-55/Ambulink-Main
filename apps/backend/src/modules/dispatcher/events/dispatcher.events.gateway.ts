import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { OnModuleDestroy } from "@nestjs/common";

import { EventBusService } from "@/core/events/event-bus.service";
import { SocketService } from "@/core/socket/socket.service";
import { BookingEventsService } from "../../booking/events/booking.events.service";
import { DispatcherEventsService } from "./dispatcher.events.service";
import { DispatcherEventsPendingRequestService } from "./dispatcher.events-pending-request.service";
import { dispatcherDecisionSubmitPayloadSchema } from "@/common/validation/socket.schemas";
import type { SocketErrorPayload } from "@ambulink/types";

@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: "/dispatcher",
})
export class DispatcherEventsGateway implements OnGatewayInit, OnModuleDestroy {
  @WebSocketServer() server: Server;
  private readonly offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private isShuttingDown = false;

  constructor(
    private dispatcherServise: DispatcherEventsService,
    private socketService: SocketService,
    private eventBus: EventBusService,
    private bookingService: BookingEventsService,
    private pendingRequestService: DispatcherEventsPendingRequestService
  ) {}

  afterInit() {
    this.socketService.dispatcherServer = this.server;
    console.log("[socket] gateway_ready", {
      namespace: "/dispatcher",
    });
  }

  async handleConnection(client: Socket) {
    console.log("[socket] connection_attempt", {
      namespace: "/dispatcher",
      clientId: client.id,
    });
    let dispatcherId: string;
    try {
      dispatcherId = this.extractSocketActorId(client, "dispatcherId");
    } catch (error) {
      console.warn("[socket] missing_auth", {
        namespace: "/dispatcher",
        clientId: client.id,
        error: error instanceof Error ? error.message : "invalid_socket_identity",
      });
      return client.disconnect(true);
    }
    client.data.dispatcherId = dispatcherId;
    this.clearPendingOffline(dispatcherId);
    await this.dispatcherServise.setStatus(dispatcherId, "AVAILABLE");
    client.join(`dispatcher:${dispatcherId}`);
    this.emitActiveBookingSync(dispatcherId);
    this.emitPendingSync(dispatcherId);
    console.log("[socket] connected", {
      namespace: "/dispatcher",
      clientId: client.id,
      dispatcherId,
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
    const dispatcherId = client.data.dispatcherId as string | undefined;
    if (dispatcherId) {
      this.scheduleOfflineIfStillDisconnected(dispatcherId);
    }
    console.log("[socket] disconnected", {
      namespace: "/dispatcher",
      clientId: client.id,
      dispatcherId,
    });
  }

  private clearPendingOffline(dispatcherId: string) {
    const timer = this.offlineTimers.get(dispatcherId);
    if (timer) {
      clearTimeout(timer);
      this.offlineTimers.delete(dispatcherId);
    }
  }

  private scheduleOfflineIfStillDisconnected(dispatcherId: string) {
    this.clearPendingOffline(dispatcherId);

    // Grace period.
    const timer = setTimeout(async () => {
      if (this.isShuttingDown) {
        this.offlineTimers.delete(dispatcherId);
        return;
      }
      try {
        const activeSockets = await this.server.in(`dispatcher:${dispatcherId}`).fetchSockets();
        if (activeSockets.length === 0) {
          await this.dispatcherServise.setStatus(dispatcherId, "OFFLINE");
        }
      } finally {
        this.offlineTimers.delete(dispatcherId);
      }
    }, 10000);

    this.offlineTimers.set(dispatcherId, timer);
  }

  onModuleDestroy() {
    this.isShuttingDown = true;
    for (const timer of this.offlineTimers.values()) {
      clearTimeout(timer);
    }
    this.offlineTimers.clear();
  }

  @SubscribeMessage("booking:decision-submit")
  handleBookingDecisionSubmit(client: Socket, data: { requestId: string; approved: boolean }) {
    const parsed = dispatcherDecisionSubmitPayloadSchema.safeParse(data);
    if (!parsed.success) {
      client.emit("socket:error", {
        code: "VALIDATION_ERROR",
        message: "Invalid booking decision payload",
      } satisfies SocketErrorPayload);
      return;
    }

    const dispatcherId = client.data.dispatcherId as string | undefined;
    if (!dispatcherId) {
      client.emit("socket:error", {
        code: "UNAUTHORIZED",
        message: "Dispatcher identity missing on socket",
      } satisfies SocketErrorPayload);
      return;
    }

    const ack = this.pendingRequestService.submitDecision(
      dispatcherId,
      parsed.data.requestId,
      parsed.data.approved
    );
    this.eventBus.publish({
      type: "realtime.dispatcher",
      dispatcherId,
      event: "booking:decision-ack",
      payload: ack,
    });
  }

  @SubscribeMessage("booking:pending-sync:request")
  handlePendingSyncRequest(client: Socket) {
    const dispatcherId = client.data.dispatcherId as string | undefined;
    if (!dispatcherId) {
      client.emit("socket:error", {
        code: "UNAUTHORIZED",
        message: "Dispatcher identity missing on socket",
      } satisfies SocketErrorPayload);
      return;
    }
    this.emitPendingSync(dispatcherId);
  }

  @SubscribeMessage("booking:sync:request")
  handleActiveBookingSyncRequest(client: Socket) {
    const dispatcherId = client.data.dispatcherId as string | undefined;
    if (!dispatcherId) {
      client.emit("socket:error", {
        code: "UNAUTHORIZED",
        message: "Dispatcher identity missing on socket",
      } satisfies SocketErrorPayload);
      return;
    }
    this.emitActiveBookingSync(dispatcherId);
  }

  private emitActiveBookingSync(dispatcherId: string) {
    this.bookingService
      .getDispatcherActiveBookings(dispatcherId)
      .then((bookings) => {
        this.eventBus.publish({
          type: "realtime.dispatcher",
          dispatcherId,
          event: "booking:sync",
          payload: {
            bookings,
          },
        });
        console.info("[dispatcher] active_booking_sync", {
          dispatcherId,
          bookingCount: bookings.length,
        });
      })
      .catch((error) => {
        console.error("[dispatcher] active booking sync failed", error);
      });
  }

  private emitPendingSync(dispatcherId: string) {
    const pendingRequests = this.pendingRequestService.getPendingForDispatcher(dispatcherId);
    this.eventBus.publish({
      type: "realtime.dispatcher",
      dispatcherId,
      event: "booking:pending-sync",
      payload: {
        requests: pendingRequests,
      },
    });
    console.info("[dispatcher] pending_request_sync", {
      dispatcherId,
      pendingCount: pendingRequests.length,
    });
  }
}
