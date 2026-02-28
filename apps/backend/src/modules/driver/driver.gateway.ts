import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { DriverService } from "../driver/driver.service";
import { BookingService } from "../booking/booking.service";
import { SocketService } from "@/core/socket/socket.service";
import type { DriverLocationPayload, SocketErrorPayload } from "@ambulink/types";
import { driverLocationPayloadSchema } from "@/common/validation/socket.schemas";
import { DriverCommandService } from "./driver-command.service";
import { TokenService } from "@/core/auth/token.service";
import { authenticateSocket } from "@/core/auth/ws-auth";
import env from "@/env";

@WebSocketGateway({ cors: { origin: env.FRONTEND_URL ?? false }, namespace: "/driver" })
export class DriverGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private driverService: DriverService,
    private bookingService: BookingService,
    private socketService: SocketService,
    private driverCommandService: DriverCommandService,
    private tokenService: TokenService
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
      const user = authenticateSocket(client, this.tokenService, ["DRIVER"]);
      driverId = user.sub;
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
      await this.driverService.setStatus(driverId, "BUSY");
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
      // Normalize online driver availability when connected and not handling an active booking.
      await this.driverService.setStatus(driverId, "AVAILABLE");
    }

    console.log("[socket] connected", {
      namespace: "/driver",
      clientId: client.id,
      driverId,
    });
  }

  handleDisconnect(client: Socket) {
    // Network disconnects are transient; shift status should be controlled by explicit clock in/out events.
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
    await this.driverCommandService.updateLocation(driverId, parsed.data);
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket) {
    const driverId = client.data.driverId;
    try {
      await this.driverCommandService.arrived(driverId);
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
      await this.driverCommandService.completed(driverId);
    } catch (_error) {
      client.emit("socket:error", {
        code: "NOT_FOUND",
        message: "No active booking found",
      } satisfies SocketErrorPayload);
    }
  }
}
