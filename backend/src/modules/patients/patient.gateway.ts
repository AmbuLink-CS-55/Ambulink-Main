import { Server, Socket } from "socket.io";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { DriverService } from "../drivers/driver.service";
import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";
import { HospitalService } from "../hospital/hospital.service";
import { DriverGateway } from "../drivers/driver.gateway";
import { Inject, forwardRef } from "@nestjs/common";
import { SocketService } from "@/services/socket.service";

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
    private hospitalService: HospitalService,
    @Inject(forwardRef(() => DriverGateway))
    private driverGateway: DriverGateway,
    private socketService: SocketService
  ) { }

  handleConnection(client: Socket) {
    const patientId = client.handshake.auth.patientId as string;
    if (!patientId) return client.disconnect(true);
    client.data.patientId = patientId;
    console.log("patient:connected", patientId);
    client.join(`patient:${patientId}`);
  }

  @SubscribeMessage("patient:help")
  async findAmbulance(client: Socket, data: PickupRequest) {
    const { lat, lng } = data;
    const patientId = client.data.patientId;
    console.log("patient:help", patientId);

    const nearestDrivers = await this.driverService.findDriverByLocation(
      lat,
      lng
    );
    if (nearestDrivers.length == 0) {
      console.log("No drivers found");
      return;
    }
    console.log("near by drivers: ", nearestDrivers)
    const hospital = await this.hospitalService.findTheNearestHospital(
      lat,
      lng
    );
    // console.log("near by hospital: ", hospital)
    const patient = await this.patientService.findOne(patientId);
    // console.log("patient", patient)
    const pickedDriver = nearestDrivers[0];
    const booking = await this.bookingService.createBooking(
      patient,
      lat,
      lng,
      null,
      hospital,
      pickedDriver,
      null
    );

    console.log("sending:booking:assigned", booking);
    this.driverGateway.server
      .to(`driver:${pickedDriver.id}`)
      .emit("booking:assigned", booking);
    client.emit("booking:assigned", booking);
  }

  @SubscribeMessage("patient:cancelled")
  async patientCancel(client: Socket, data: PickupRequest) {
    const patientId = client.data.patientId;
    const booking = await this.bookingService.cancelByPatient(patientId, "cancelled by patient");
    const driverId = booking.driverId;
    this.driverGateway.server
      .to(`driver:${driverId}`)
      .emit("booking:cancelled", booking);
  }
}
