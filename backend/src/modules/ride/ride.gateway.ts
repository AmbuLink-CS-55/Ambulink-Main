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
import { AmbulanceService } from "../ambulance/ambulance.service";
import { bookings } from "src/database/schema";
import { eq } from "drizzle-orm";

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

type OnlineAmbulance = {
  socket: Socket;
  driverId: string;
  status: "available" | "busy" | "in-ride";
  lat: number;
  lng: number;
};

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/ride" })
export class RideGateway {
  @WebSocketServer()
  server: Server;

  private onlineAmbulances = new Map<string, OnlineAmbulance>();

  constructor(
    private db: DbService,
    private redis: RedisService,
    private ambulance: AmbulanceService
  ) {}

  handleDisconnect(client: Socket) {
    for (const [ambulanceId, data] of this.onlineAmbulances) {
      if (data.socket.id === client.id) {
        this.onlineAmbulances.delete(ambulanceId);
        console.log(`Ambulance ${ambulanceId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage("patient:help")
  async findAmbulance(client: Socket, data: PickupRequest) {
    // find ambulances
    const ambulances: any = await this.ambulance.findAmbulance(
      data.patientId,
      data.lat,
      data.lng
    );

    console.log("help request:", data)

    // const [booking] = await this.db.getDb()
    //   .insert(bookings)
    //   .values({
    //     patientId: data.patientId,
    //     pickupAddress: data.address ?? "",
    //     pickupLocation: { x: data.lng, y: data.lat },
    //     emergencyType: data.emergencyType ?? "",
    //     status: "REQUESTED",
    //   })
    //   .returning();

    const availableAmbulances = ambulances.filter((a: any) => {
      const online = this.onlineAmbulances.get(a.ambulanceId);
      return online?.status === "available";
    });

    if (availableAmbulances.length === 0) {
      client.emit("error", { message: "No ambulances available" });
      return;
    }

    // Mock booking for testing
    const booking = {
      id: `booking-${Date.now()}`,
      patientId: data.patientId,
      pickupAddress: data.address ?? "",
      emergencyType: data.emergencyType ?? "",
      status: "REQUESTED",
    };

    const picked = availableAmbulances[0];
    const ambulance = this.onlineAmbulances.get(picked.ambulanceId);

    if (ambulance) {
      ambulance.status = "busy";
    }
    console.log("booking response:", booking)

    client.join(`booking:${booking.id}`);
    client.emit("ambulance:assigned", { ...ambulances[0], bookingId: booking.id });
    ambulance?.socket.emit("ride:request", booking);
  }

  @SubscribeMessage("driver:online")
  driverOnline(client: Socket, data: AmbulanceUpdate) {
    this.onlineAmbulances.set(data.ambulanceId, {
      socket: client,
      driverId: data.driverId,
      status: "available",
      lat: data.lat,
      lng: data.lng,
    });
    this.ambulance.updateAmbulanceLocation(data.ambulanceId, data.lat, data.lng);
    console.log(`Ambulance ${data.ambulanceId} online at ${data.lat}, ${data.lng}`);
  }

  @SubscribeMessage("driver:offline")
  driverOffline(client: Socket, data: AmbulanceUpdate) {
    this.onlineAmbulances.delete(data.ambulanceId);
    console.log(`Ambulance ${data.ambulanceId} offline`);
  }

  @SubscribeMessage("driver:update")
  driverUpdate(client: Socket, data: AmbulanceUpdate) {
    const ambulance = this.onlineAmbulances.get(data.ambulanceId);
    if (ambulance) {
      ambulance.lat = data.lat;
      ambulance.lng = data.lng;
    }
    this.ambulance.updateAmbulanceLocation(data.ambulanceId, data.lat, data.lng);
  }

  @SubscribeMessage("driver:accept")
  async driverAccept(client: Socket, data: RideAction) {
    // const [updated] = await this.db.getDb()
    //   .update(bookings)
    //   .set({
    //     status: "ASSIGNED",
    //     driverId: data.driverId,
    //     ambulanceId: data.ambulanceId,
    //     assignedAt: new Date(),
    //   })
    //   .where(eq(bookings.id, data.bookingId))
    //   .returning();
    const ambulance = this.onlineAmbulances.get(data.ambulanceId!);
    if (ambulance) {
      ambulance.status = "in-ride";
    }
    const updated = {
      id: data.bookingId,
      status: "ASSIGNED",
      patientId: data.patientId,
      driverId: data.driverId,
      ambulanceId: data.ambulanceId,
    };

    client.join(`booking:${data.bookingId}`);
    this.server.to(`booking:${data.bookingId}`).emit("booking:updated", updated);
  }


  @SubscribeMessage("driver:pickup")
  async driverPickup(client: Socket, data: RideAction) {
    // const [updated] = await this.db.getDb()
    //   .update(bookings)
    //   .set({
    //     status: "PICKEDUP",
    //     pickedupAt: new Date(),
    //   })
    //   .where(eq(bookings.id, data.bookingId))
    //   .returning();

    const updated = {
      id: data.bookingId,
      status: "PICKEDUP",
      patientId: data.patientId,
    };

    this.server.to(`booking:${data.bookingId}`).emit("booking:updated", updated);
  }

  @SubscribeMessage("driver:arrived")
  async driverArrived(client: Socket, data: RideAction & { hospitalId?: string }) {
    // const [updated] = await this.db.getDb()
    //   .update(bookings)
    //   .set({
    //     status: "ARRIVED",
    //     arrivedAt: new Date(),
    //     hospitalId: data.hospitalId,
    //   })
    //   .where(eq(bookings.id, data.bookingId))
    //   .returning();

    const updated = {
      id: data.bookingId,
      status: "ARRIVED",
      patientId: data.patientId,
      hospitalId: data.hospitalId,
    };

    this.server.to(`booking:${data.bookingId}`).emit("booking:updated", updated);
  }

  @SubscribeMessage("driver:complete")
  async driverComplete(client: Socket, data: RideAction & { fareFinal?: string }) {
    // const [updated] = await this.db.getDb()
    //   .update(bookings)
    //   .set({
    //     status: "COMPLETED",
    //     completedAt: new Date(),
    //     fareFinal: data.fareFinal,
    //   })
    //   .where(eq(bookings.id, data.bookingId))
    //   .returning();
    const ambulance = this.onlineAmbulances.get(data.ambulanceId!);
    if (ambulance) {
      ambulance.status = "available";
    }
    const updated = {
      id: data.bookingId,
      status: "COMPLETED",
      patientId: data.patientId,
      fareFinal: data.fareFinal,
    };

    this.server.to(`booking:${data.bookingId}`).emit("booking:updated", updated);
  }

  @SubscribeMessage("patient:cancel")
  async Patientcancel(client: Socket, data: RideAction & { reason?: string }) {
    // const [updated] = await this.db.getDb()
    //   .update(bookings)
    //   .set({
    //     status: "CANCELLED",
    //     cancellationReason: data.reason,
    //   })
    //   .where(eq(bookings.id, data.bookingId))
    //   .returning();

    const ambulance = this.onlineAmbulances.get(data.ambulanceId!);
    if (ambulance) {
      ambulance.status = "available";
    }

    const updated = {
      id: data.bookingId,
      status: "CANCELLED",
      patientId: data.patientId,
      cancellationReason: data.reason,
    };

    this.server.to(`booking:${data.bookingId}`).emit("booking:updated", updated);
  }

  @SubscribeMessage("driver:cancel")
  async driverCancel(client: Socket, data: RideAction & { reason?: string }) {
    // const [updated] = await this.db.getDb()
    //   .update(bookings)
    //   .set({
    //     status: "CANCELLED",
    //     cancellationReason: data.reason,
    //   })
    //   .where(eq(bookings.id, data.bookingId))
    //   .returning();
    const ambulance = this.onlineAmbulances.get(data.ambulanceId!);
    if (ambulance) {
      ambulance.status = "available";
    }
    const updated = {
      id: data.bookingId,
      status: "CANCELLED",
      patientId: data.patientId,
      cancellationReason: data.reason,
    };

    this.server.to(`booking:${data.bookingId}`).emit("booking:updated", updated);
  }
}
