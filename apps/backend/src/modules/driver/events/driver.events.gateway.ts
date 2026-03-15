import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { SocketService } from "@/core/socket/socket.service";
import type { DriverLocationPayload, SocketErrorPayload } from "@ambulink/types";
import { driverLocationPayloadSchema } from "@/common/validation/socket.schemas";
import { DriverEventsService } from "./driver.events.service";
import { BookingEventsService } from "@/modules/booking/events/booking.events.service";
import { verifyAuthToken } from "@/common/auth/auth-token";

@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: "/driver",
})
export class DriverEventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private driverEventsService: DriverEventsService,
    private bookingService: BookingEventsService,
    private socketService: SocketService
  ) {}

  afterInit() {
    this.socketService.driverServer = this.server;
    console.log("[socket] gateway_ready", {
      namespace: "/driver",
    });
  }

  async handleConnection(client: Socket) {
    console.log("[socket] connection_attempt", {
      namespace: "/driver",
      clientId: client.id,
    });
    let driverId: string;
    try {
      driverId = this.extractSocketActorId(client, "driverId");
    } catch {
      console.warn("[socket] missing_auth", {
        namespace: "/driver",
        clientId: client.id,
      });
      return client.disconnect(true);
    }
    client.data.driverId = driverId;

    client.join(`driver:${driverId}`);

    const activeBooking = await this.bookingService.getActiveBookingForDriver(driverId);

    if (activeBooking) {
      await this.driverEventsService.setStatus(driverId, "BUSY");
      if (
        activeBooking.status === "ASSIGNED" ||
        activeBooking.status === "ARRIVED" ||
        activeBooking.status === "PICKEDUP"
      ) {
        const bookingPayload = await this.bookingService.buildAssignedBookingPayload(
          activeBooking.id
        );
        if (bookingPayload) {
          client.emit("booking:assigned", bookingPayload);
        }
      }
    } else {
      await this.driverEventsService.setStatus(driverId, "AVAILABLE");
    }

    console.log("[socket] connected", {
      namespace: "/driver",
      clientId: client.id,
      driverId,
    });
  }

  private extractSocketActorId(client: Socket, key: "driverId") {
    const accessToken =
      typeof client.handshake.auth?.accessToken === "string"
        ? client.handshake.auth.accessToken
        : typeof client.handshake.query?.accessToken === "string"
          ? client.handshake.query.accessToken
          : null;
    if (!accessToken) {
      throw new Error("accessToken is required");
    }
    const payload = verifyAuthToken(accessToken);
    if (!payload || payload.role !== "DRIVER") {
      throw new Error("Invalid socket access token");
    }

    const authValue = client.handshake.auth?.[key];
    const queryValue = client.handshake.query?.[key];
    const providedValue =
      typeof authValue === "string"
        ? authValue
        : typeof queryValue === "string"
          ? queryValue
          : null;
    if (providedValue && providedValue !== payload.sub) {
      throw new Error("Socket actor mismatch");
    }
    return payload.sub;
  }

  handleDisconnect(client: Socket) {
    console.log("[socket] disconnected", {
      namespace: "/driver",
      clientId: client.id,
      driverId: client.data.driverId,
    });
  }

  @SubscribeMessage("driver:update")
  async updateDriverLocation(client: Socket, data: DriverLocationPayload) {
    const parsed = driverLocationPayloadSchema.safeParse(data);
    if (!parsed.success) {
      client.emit("socket:error", {
        code: "VALIDATION_ERROR",
        message: "Invalid driver location payload",
      } satisfies SocketErrorPayload);
      return;
    }
    const driverId = client.data.driverId;
    await this.driverEventsService.updateLocation(driverId, parsed.data);
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket) {
    const driverId = client.data.driverId;
    try {
      await this.driverEventsService.arrived(driverId);
    } catch (_error) {
      client.emit("socket:error", {
        code: "NOT_FOUND",
        message: "No active booking found",
      } satisfies SocketErrorPayload);
    }
  }

  @SubscribeMessage("driver:completed")
  async driverCompleted(client: Socket) {
    const driverId = client.data.driverId;
    try {
      await this.driverEventsService.completed(driverId);
    } catch (_error) {
      client.emit("socket:error", {
        code: "NOT_FOUND",
        message: "No active booking found",
      } satisfies SocketErrorPayload);
    }
  }
}
