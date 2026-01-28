import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { DbService } from "@/services/db.service";
import { DriverService } from "../drivers/driver.service";
import { BookingService } from "../booking/booking.service";
import { PatientGateway } from "../patients/patient.gateway";
import { Inject, forwardRef } from "@nestjs/common";
import { SocketService } from "@/services/socket.service";

type DriverLocation = {
  id: string;
  latitude: number;
  longitude: number;
};

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/driver" })
export class DriverGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private driverService: DriverService,
    @Inject(forwardRef(() => PatientGateway))
    private patientGateway: PatientGateway,
    private bookingService: BookingService,
  ) { }

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
  async updateDriverLocation(client: Socket, data: DriverLocation) {
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
    this.bookingService.setArrived(bookingData.id);
    const { id, patientId } = bookingData;
    this.patientGateway.server
      .to(`patient:${patientId}`)
      .emit("booking:arrived", { bookingId: id });
    console.log("patient:arrived", patientId);
  }

  @SubscribeMessage("driver:completed")
  async driverCompleted(client: Socket, data: { driverId: string }) {
    const driverId = client.data.driverId;
    const bookingData = await this.driverService.getDriverBooking(driverId);
    this.bookingService.setCompleted(bookingData.id);
    const { id, patientId } = bookingData;
    this.patientGateway.server
      .to(`patient:${patientId}`)
      .emit("booking:completed", { bookingId: id });
    console.log("patient:arrived", patientId);
  }
}
