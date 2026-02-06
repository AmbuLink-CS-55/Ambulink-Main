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
import type { 
  DriverLocationUpdate,
  DriverToServerEvents,
  ServerToDriverEvents
} from "@/common/types";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/driver" })
export class DriverGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server<DriverToServerEvents, ServerToDriverEvents>;

  constructor(
    private driverService: DriverService,
    private bookingService: BookingService,
    private socketService: SocketService
  ) {}

  afterInit() {
    this.socketService.driverServer = this.server;
  }

  handleConnection(client: Socket) {
    const driverId = client.handshake.auth.driverId as string;
    if (!driverId) return client.disconnect(true);
    client.data.driverId = driverId;

    client.join(`driver:${driverId}`);

    this.driverService.setStatus(driverId, "AVAILABLE");

    console.log("driver:connected", driverId);
  }

  handleDisconnect(client: Socket) {
    this.driverService.setStatus(client.data.driverId, "OFFLINE");
    console.log(`Client disconnected: ${client.id}`);
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
    const bookingData = await this.driverService.getDriverBooking(driverId);
    this.bookingService.updateBooking(bookingData.id, { status: "COMPLETED" });
    const { id, patientId } = bookingData;
    this.socketService.emitToPatient(patientId!, "booking:completed", {
      bookingId: id,
    });
    console.log("patient:completed", patientId);
  }
}
