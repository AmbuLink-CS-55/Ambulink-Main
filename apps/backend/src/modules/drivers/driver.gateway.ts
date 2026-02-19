import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { DriverService } from "../drivers/driver.service";
import { BookingService } from "../booking/booking.service";
import { SocketService } from "@/common/socket/socket.service";
import type { DriverLocationPayload, SocketErrorPayload } from "@ambulink/types";
import { driverLocationPayloadSchema } from "@/common/validation/socket.schemas";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/driver" })
export class DriverGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private lastEmitTimes = new Map<string, number>();

  constructor(
    private driverService: DriverService,
    private bookingService: BookingService,
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
    const driverId = client.handshake.auth.driverId as string;
    if (!driverId) {
      console.warn("[socket] missing_auth", {
        namespace: "/driver",
        clientId: client.id,
      });
      return client.disconnect(true);
    }
    client.data.driverId = driverId;

    client.join(`driver:${driverId}`);
    this.driverService.setStatus(driverId, "AVAILABLE");

    const activeBooking = await this.bookingService.getActiveBookingForDriver(driverId);

    if (activeBooking) {
      if (activeBooking.status === "ASSIGNED" || activeBooking.status === "ARRIVED") {
        const bookingPayload = await this.bookingService.buildAssignedBookingPayload(
          activeBooking.id
        );
        if (bookingPayload) {
          client.emit("booking:assigned", bookingPayload);
        }
      }
    }

    console.log("[socket] connected", {
      namespace: "/driver",
      clientId: client.id,
      driverId,
    });
  }

  handleDisconnect(client: Socket) {
    this.driverService.setStatus(client.data.driverId, "OFFLINE");
    this.lastEmitTimes.delete(client.data.driverId); // Clean up
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
    const { x, y } = parsed.data;
    const driverId = client.data.driverId;
    this.driverService.setDriverLocation(driverId, y, x);

    // Send to specific dispatcher if booked
    this.bookingService.sendDriverLocation(driverId, { id: driverId, x, y });

    // Broadcast to all dispatchers if available (throttled to 1 update/sec per driver)
    const now = Date.now();
    const lastEmit = this.lastEmitTimes.get(driverId) || 0;
    if (now - lastEmit > 1000) {
      this.socketService.emitToAllDispatchers("driver:update", {
        id: driverId,
        x,
        y,
      });
      this.lastEmitTimes.set(driverId, now);
    }
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket) {
    const driverId = client.data.driverId;
    const bookingData = await this.driverService.getDriverBooking(driverId);
    if (!bookingData) {
      client.emit("socket:error", {
        code: "NOT_FOUND",
        message: "No active booking found",
      } satisfies SocketErrorPayload);
      return;
    }
    this.bookingService.updateBooking(bookingData.id, { status: "ARRIVED" });
    const { id, patientId } = bookingData;
    this.socketService.emitToPatient(patientId!, "booking:arrived", {
      bookingId: id,
    });
    console.log("patient:arrived", patientId);
  }

  @SubscribeMessage("driver:completed")
  async driverCompleted(client: Socket) {
    const driverId = client.data.driverId;
    console.log("completed from", driverId);
    const bookingData = await this.driverService.getDriverBooking(driverId);
    if (!bookingData) {
      client.emit("socket:error", {
        code: "NOT_FOUND",
        message: "No active booking found",
      } satisfies SocketErrorPayload);
      return;
    }
    console.log(bookingData);
    this.bookingService.updateBooking(bookingData.id, { status: "COMPLETED" });
    this.driverService.setStatus(driverId, "AVAILABLE");
    const { id, patientId } = bookingData;
    this.socketService.emitToPatient(patientId!, "booking:completed", {
      bookingId: id,
    });
    this.socketService.emitToDriver(driverId, "booking:completed", {
      bookingId: id,
    });
    console.log("patient:completed", patientId);
  }
}
