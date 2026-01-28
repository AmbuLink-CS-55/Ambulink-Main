import { Server } from "socket.io";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { BookingService } from "./booking.service";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/booking" })
export class BookingGateway {
  @WebSocketServer() server: Server;

  constructor(private bookingService: BookingService) {}

  notifyPatient(patientId: string, event: string, data: any) {
    this.server.to(`patient:${patientId}`).emit(event, data);
  }

  notifyDriver(driverId: string, event: string, data: any) {
    this.server.to(`driver:${driverId}`).emit(event, data);
  }
}
