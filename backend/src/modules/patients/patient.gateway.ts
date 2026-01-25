import { Server, Socket } from "socket.io";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { DbService } from "@/database/db.service";
import { RedisService } from "@/database/redis.service";
import { AmbulanceService } from "../ambulance/ambulance.service";
import { DriverService } from "../drivers/driver.service";
import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";

type PickupRequest = {
  patientId: string;
  lat: number;
  lng: number;
};

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/patient" })
export class PatientGateway {
  @WebSocketServer() server: Server;

  constructor(
    private patientService: PatientService,
    private driverService: DriverService,
    private bookingService: BookingService
  ) {}

  handleConnection(client: Socket) {
    const patientId = client.handshake.auth.patientId as string;
    if (!patientId) return client.disconnect(true);
    this.patientService.patientIdSocketMap.set(patientId, client.id);
  }

  handleDisconnect(client: Socket) {
    for (const [
      patientId,
      pClient,
    ] of this.patientService.patientIdSocketMap.entries()) {
      if (client.id == pClient) {
        this.patientService.patientIdSocketMap.delete(patientId);
      }
    }
  }

  @SubscribeMessage("patient:help")
  async findAmbulance(client: Socket, data: PickupRequest) {
    console.log("help request:", data);
    const patientId = data.patientId;
    const bookingID = this.bookingService.createBooking(patientId);
    this.bookingService.setPatientWS(bookingID, client);
    // find ambulances
    const drivers = await this.driverService.findDriverByLocation(
      data.lat,
      data.lng
    );

    if (drivers.length === 0) {
      client.emit("error", { message: "No ambulances available" });
      return;
    }

    const pickedDriver = drivers[0];
    console.log("driver picked:", pickedDriver);
    this.driverService.setStatus(pickedDriver[0], "BUSY");

    // later get from db
    const bookingData = { driverName: "me", pridiverName: "me" };

    client.emit("booking:assigned", bookingData);
  }
}
