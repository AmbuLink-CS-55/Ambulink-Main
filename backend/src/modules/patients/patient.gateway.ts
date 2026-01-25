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
import { pick } from "node_modules/zod/v4/core/util";

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
    // console.log("ws:connect", client)
    const patientId = client.handshake.auth.patientId as string;
    if (!patientId) return client.disconnect(true);
    this.patientService.setWS(patientId, client.id);
  }

  handleDisconnect(client: Socket) {
  }

  @SubscribeMessage("patient:help")
  async findAmbulance(client: Socket, data: PickupRequest) {
    console.log("patient:help:recieved", data);
    const patientId = data.patientId;
    const bookingID = this.bookingService.createBooking(patientId);
    console.log("patient:help:bookingID", bookingID)
    this.bookingService.setPatientWS(bookingID, client);
    // find ambulances
    const drivers = await this.driverService.findDriverByLocation(
      data.lat,
      data.lng
    );
    console.log("patient:help:drivers", drivers)
    if (drivers.length === 0) {
      client.emit("error", { message: "No ambulances available" });
      return;
    }

    const pickedDriver = drivers[0];
    const pickedDriverData = this.driverService.findOne(pickedDriver[0])
    console.log("patient:help:pickeddriver", pickedDriverData)
    this.driverService.getWS(pickedDriver[0])
    this.driverService.setStatus(pickedDriver[0], "BUSY");

    // later get from db
    const bookingData = { driverName: "me", pridiverName: "me" };

    client.emit("booking:assigned", bookingData);
  }
}
