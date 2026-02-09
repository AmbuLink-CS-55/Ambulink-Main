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
import { userStatusEnum } from "@/common/database/schema";
import type { DriverLocationUpdate } from "@/common/types/socket.types";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/driver" })
export class DriverGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

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

  handleConnection(client: Socket) {
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

    console.log("[socket] connected", {
      namespace: "/driver",
      clientId: client.id,
      driverId,
    });
  }

  handleDisconnect(client: Socket) {
    this.driverService.setStatus(client.data.driverId,"OFFLINE");
    console.log("[socket] disconnected", {
      namespace: "/driver",
      clientId: client.id,
      driverId: client.data.driverId,
    });
  }

  @SubscribeMessage("driver:update")
  async updateDriverLocation(client: Socket, data: DriverLocationUpdate) {
    const driverId = client.data.driverId;
    this.driverService.setDriverLocation(
      driverId,
      data.latitude,
      data.longitude
    );
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket) {
    const driverId = client.data.driverId;
    const bookingData = await this.driverService.getDriverBooking(driverId);
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
    console.log("completed from", driverId)
    const bookingData = await this.driverService.getDriverBooking(driverId);
    console.log(bookingData)
    this.bookingService.updateBooking(bookingData.id, { status: "COMPLETED" });
    const { id, patientId } = bookingData;
    this.socketService.emitToPatient(patientId!, "booking:completed", {
      bookingId: id,
    });
    console.log("patient:completed", patientId);
  }
}
