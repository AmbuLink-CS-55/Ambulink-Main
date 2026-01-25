import { Server, Socket } from "socket.io";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { DbService } from "@/database/db.service";
import { RedisService } from "@/database/redis.service";
import { AmbulanceService } from "../ambulance/ambulance.service";
import { DriverService } from "../drivers/driver.service";
import { BookingService } from "../booking/booking.service";
import Redis from "ioredis";

type DriverLocation = {
  id: string;
  lat: number;
  lng: number;
};
type bookingWSs = { driverWS: Socket | null; patientWS: Socket | null };

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/driver" })
export class driverGateway {
  @WebSocketServer()
  server: Server;
  private redisClient: Redis;

  constructor(
    private db: DbService,
    private redis: RedisService,
    private driverService: DriverService,
    private bookingService: BookingService
  ) {
    this.redisClient = redis.getClient();
  }

  handleConnection(client: Socket) {
    const driverId = client.handshake.auth.driverId as string;
    if (!driverId) return client.disconnect(true);

    this.driverService.setStatus(driverId, "UNKNOWN")
    this.driverService.setWS(driverId, client.id)
    console.log("driver:connected", driverId)
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
    const bookingWS = this.bookingService.getWSByUserID(data.driverId);
    bookingWS?.patientWS?.emit("booking:arrived");
  }

  @SubscribeMessage("driver:completed")
  async driverCompleted(client: Socket, data: { driverId: string }) {
    const bookingWS = this.bookingService.getWSByUserID(data.driverId);
    this.driverService.setStatus(data.driverId, "AVAILABLE")
    bookingWS?.patientWS?.emit("booking:completed");
  }
}
