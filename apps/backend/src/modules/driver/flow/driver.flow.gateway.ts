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
import { DriverFlowService } from "./driver.flow.service";
import { BookingFlowService } from "@/modules/booking/flow/booking.flow.service";

@WebSocketGateway({
  cors: {
    origin: true,
  },
  namespace: "/driver",
})
export class DriverFlowGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private driverFlowService: DriverFlowService,
    private bookingService: BookingFlowService,
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
      await this.driverFlowService.setStatus(driverId, "BUSY");
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
      await this.driverFlowService.setStatus(driverId, "AVAILABLE");
    }

    console.log("[socket] connected", {
      namespace: "/driver",
      clientId: client.id,
      driverId,
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
    await this.driverFlowService.updateLocation(driverId, parsed.data);
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket) {
    const driverId = client.data.driverId;
    try {
      await this.driverFlowService.arrived(driverId);
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
      await this.driverFlowService.completed(driverId);
    } catch (_error) {
      client.emit("socket:error", {
        code: "NOT_FOUND",
        message: "No active booking found",
      } satisfies SocketErrorPayload);
    }
  }
}
