import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { DriverService } from "../drivers/driver.service";
import { PatientService } from "./patient.service";
import { BookingService } from "../booking/booking.service";
import { HospitalService } from "../hospital/hospital.service";
import { SocketService } from "@/common/socket/socket.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { reset } from "drizzle-seed";

type PickupRequest = {
  patientId: string;
  lat: number;
  lng: number;
};

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/patient" })
export class PatientGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(
    private patientService: PatientService,
    private driverService: DriverService,
    private bookingService: BookingService,
    private hospitalService: HospitalService,
    private socketService: SocketService,
    private dispatcherService: DispatcherService
  ) { }

  afterInit() {
    this.socketService.patientServer = this.server;
  }

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
    const patient = await this.patientService.findOne(patientId);

    const nearestDrivers = await this.driverService.findDriverByLocation(
      lat,
      lng
    );
    if (nearestDrivers.length == 0) {
      console.log("No drivers found");
      return;
    }

    console.log("waiting for dispatcher approval")
    const result = await this.bookingService.askDispatchers(nearestDrivers, patient);
    if (!result) {
        client.emit("die")
        return
    }
    const { dispatcherId, pickedDriver} = result;

    const hospital = await this.hospitalService.findTheNearestHospital(
      lat,
      lng
    );

    const booking = await this.bookingService.createBooking(
      patient,
      lat,
      lng,
      null,
      hospital,
      pickedDriver,
      null
    );

    this.socketService.emitToDispatcher(dispatcherId, "booking:assigned", booking)
    this.socketService.emitToDriver(
      pickedDriver.id,
      "booking:assigned",
      booking
    );
    client.emit("booking:assigned", booking);
  }

  @SubscribeMessage("patient:cancelled")
  async patientCancel(client: Socket, data: PickupRequest) {
    const patientId = client.data.patientId;
    const bookingData = await this.bookingService.getOngoingBookingByUserId(patientId);
    this.bookingService.updateBooking(bookingData.id, { status: "CANCELLED" });
    const driverId = bookingData.driverId;
    this.socketService.emitToDriver(
      driverId!,
      "booking:cancelled",
      bookingData
    );
  }
}
