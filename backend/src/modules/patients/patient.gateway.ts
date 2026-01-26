import { Server, Socket } from "socket.io";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { DbService } from "@/database/db.service";

import { AmbulanceService } from "../ambulance/ambulance.service";
import { DriverService } from "../drivers/driver.service";
import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";
import * as Q from "@/database/queries/booking.queries";
import { bookings } from "@/database/schema";
import { sql } from "drizzle-orm";
import { WebsocketSessionService } from "@/services/websocket-session.service";
import { HospitalService } from "../hospital/hospital.service";

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
    private bookingService: BookingService,
    private db: DbService,
    private websocketSessionService: WebsocketSessionService,
    private hospitalService: HospitalService
  ) {}

  handleConnection(client: Socket) {
    // console.log("ws:connect", client)
    const patientId = client.handshake.auth.patientId as string;
    if (!patientId) return client.disconnect(true);
  }

  handleDisconnect(client: Socket) {
  }

  @SubscribeMessage("patient:help")
  async findAmbulance(client: Socket, data: PickupRequest) {
    const { patientId, lat, lng } = data;
    console.log("patient:help:", data)

    const nearestDrivers = await this.driverService.findDriverByLocation(lat, lng)
    if (nearestDrivers.length == 0) {
      console.log("No drivers found")
      return
    }
    console.log("near by drivers: ", nearestDrivers)
    const hospital = await this.hospitalService.findTheNearestHospital(lat, lng)
    console.log("near by hospital: ", hospital)
    const patient = await this.patientService.findOne(patientId)
    console.log("patient", patient)
    const pickedDriver = nearestDrivers[0];

    const booking = await this.bookingService.createBooking(
      patient, lat, lng,
      null, hospital, pickedDriver, null)

    const driverClient = this.websocketSessionService.getDriverSocket(pickedDriver.id)
    if (!driverClient) {
      console.log("No driver WS found")
      return
    }

    console.log(driverClient)
    console.log("sending:booking:assigned", booking)
    driverClient!.emit("booking:assigned", booking)
    client.emit("booking:assigned", booking)
  }
}
