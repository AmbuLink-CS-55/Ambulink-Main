import { Server, Socket } from "socket.io";
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { SocketService } from "@/core/socket/socket.service";
import { BookingService } from "../booking/booking.service";
import { DispatcherService } from "./dispatcher.service";

@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: "/dispatcher",
})
export class DispatcherGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private readonly offlineTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private dispatcherServise: DispatcherService,
    private socketService: SocketService,
    private bookingService: BookingService
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
    this.bookingService
      .getDispatcherActiveBookings(dispatcherId)
      .then((bookings) => {
        this.socketService.emitToDispatcher(dispatcherId, "booking:sync", {
          bookings,
        });
      })
      .catch((error) => {
        console.error("[dispatcher] active booking sync failed", error);
      });
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

    // Grace period avoids flapping status during short network drops.
    const timer = setTimeout(async () => {
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
}
