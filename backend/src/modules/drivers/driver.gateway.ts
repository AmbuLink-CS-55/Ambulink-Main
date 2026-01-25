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

type DriverLocation = {
  id: string;
  lat: number;
  lng: number;
};
type bookingWSs = { driverWS: Socket | null; patientWS: Socket | null };

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/driver" })
class driverGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private db: DbService,
    private redis: RedisService,
    private driverService: DriverService,
    private bookingService: BookingService
  ) {}

  @SubscribeMessage("driver:update")
  async updateDriverLocation(client: Socket, data: DriverLocation) {
    this.driverService.setDriverLocation(data.id, data.lat, data.lng);
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket, data: { id: string }) {
    const bookingWS = this.bookingService.getWSByUserID(data.id);
    bookingWS?.patientWS?.emit("booking:arrived");
  }

  @SubscribeMessage("driver:completed")
  async driverCompleted(client: Socket, data: { id: string }) {
    const bookingWS = this.bookingService.getWSByUserID(data.id);
    bookingWS?.patientWS?.emit("booking:completed");
  }
}
