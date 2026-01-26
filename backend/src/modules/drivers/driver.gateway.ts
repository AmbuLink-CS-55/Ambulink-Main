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

type DriverLocation = {
  id: string;
  lat: number;
  lng: number;
};

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/driver" })
export class DriverGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private db: DbService,
    private driverService: DriverService,
    private websocketSessionService: WebsocketSessionService,
    private bookingService: BookingService
  ) {
  }

  handleConnection(client: Socket) {
    const driverId = client.handshake.auth.driverId as string;
    if (!driverId) return client.disconnect(true);
    client.data.driverId = driverId;

    this.driverService.setStatus(driverId, "AVAILABLE")
    this.websocketSessionService.setDriverSocket(driverId, client)

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
    this.driverService.setDriverLocation(data.id, data.lat, data.lng);
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket, data: { driverId: string }) {

  }

  @SubscribeMessage("driver:completed")
  async driverCompleted(client: Socket, data: { driverId: string }) {

  }
}
