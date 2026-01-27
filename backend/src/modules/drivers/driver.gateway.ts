import { Server, Socket } from "socket.io";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { DbService } from "@/database/db.service";
import { AmbulanceService } from "../ambulance/ambulance.service";
import { DriverService } from "../drivers/driver.service";
import { BookingService } from "../booking/booking.service";
import Redis from "ioredis";
import { WebsocketSessionService } from "@/services/websocket-session.service";
import { bookings } from "@/database/schema";
import { eq } from "drizzle-orm";
import { PatientGateway } from "../patients/patient.gateway";
import { Inject, forwardRef } from "@nestjs/common";

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
    private db: DbService,
    private driverService: DriverService,
    private websocketSessionService: WebsocketSessionService,
    @Inject(forwardRef(() => PatientGateway))
    private patientGateway: PatientGateway,
    private bookingService: BookingService
  ) {
  }

  handleConnection(client: Socket) {
    const driverId = client.handshake.auth.driverId as string;
    if (!driverId) return client.disconnect(true);
    client.data.driverId = driverId;

    client.join(`driver:${driverId}`);

    this.driverService.setStatus(driverId, "AVAILABLE")
    this.websocketSessionService.getDriverSocket(driverId)?.emit("message", "works")
    console.log("driver:connected", driverId)
  }

  handleDisconnect(client: Socket) {
    this.driverService.setStatus(client.data.driverId, "OFFLINE")
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("ping")
  ping(client: Socket) {
    console.log("ping")
  }

  @SubscribeMessage("driver:update")
  async updateDriverLocation(client: Socket, data: DriverLocation) {
    const driverId = client.data.driverId
    this.driverService.setDriverLocation(driverId, data.latitude, data.latitude);
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket) {
    const driverId = client.data.driverId;
    const bookingData = await this.driverService.getDriverBooking(driverId)
    this.bookingService.setArrived(bookingData.id);
    const {id, patientId} = bookingData
    this.patientGateway.server.to(`patient:${patientId}`).emit("booking:arrived", { bookingId: id })
  }

  @SubscribeMessage("driver:completed")
  async driverCompleted(client: Socket, data: { driverId: string }) {
    const driverId = client.data.driverId;
    const bookingData = await this.driverService.getDriverBooking(driverId)
    this.bookingService.setCompleted(bookingData.id);
    const {id, patientId} = bookingData
    this.patientGateway.server.to(`patient:${patientId}`).emit("booking:completed", {bookingId: id})
  }
}
