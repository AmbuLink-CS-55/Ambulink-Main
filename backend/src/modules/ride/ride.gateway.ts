import { RedisService } from "@/database/redis.service";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DbService } from "src/database/db.service";

type PickupRequest = {
  patientId: string;
  lat: number;
  lng: number;
  address?: string;
  emergencyType?: string;
};

type AmbulanceUpdate = {
  ambulanceId: string;
  driverId: string;
  lat: number;
  lng: number;
};

type RideAction = {
  bookingId: string;
  driverId?: string;
  ambulanceId?: string;
  patientId: string;
};

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/ride" })
export class RideGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private db: DbService,
    private redis: RedisService
  ) {}

}
