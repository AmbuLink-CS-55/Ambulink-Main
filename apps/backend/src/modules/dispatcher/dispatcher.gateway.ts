import { Server, Socket } from "socket.io";
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Inject, forwardRef } from "@nestjs/common";

import { SocketService } from "@/common/socket/socket.service";
import { BookingService } from "../booking/booking.service";
import { DispatcherService } from "./dispatcher.service";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/dispatcher" })
export class DispatcherGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(
    private dispatcherServise: DispatcherService,
    private socketService: SocketService,
    @Inject(forwardRef(() => BookingService)) private bookingService: BookingService
  ) {}

  afterInit() {
    this.socketService.dispatcherServer = this.server;
    console.log("[socket] gateway_ready", {
      namespace: "/dispatcher",
    });
  }

  handleConnection(client: Socket) {
    console.log("[socket] connection_attempt", {
      namespace: "/dispatcher",
      clientId: client.id,
    });
    const dispatcherId = client.handshake.auth.dispatcherId as string;
    if (!dispatcherId) {
      console.warn("[socket] missing_auth", {
        namespace: "/dispatcher",
        clientId: client.id,
      });
      return client.disconnect(true);
    }
    client.data.dispatcherId = dispatcherId;
    this.dispatcherServise.setStatus(dispatcherId, "AVAILABLE");
    client.join(`dispatcher:${dispatcherId}`);
    this.bookingService
      .getDispatcherActiveBookings(dispatcherId)
      .then((bookings) => {
        this.socketService.emitToDispatcher(dispatcherId, "booking:sync", {
          bookings,
        });
      })
      .catch((error) => {
        console.error("[dispatcher] active booking sync failed", error);
      });
    console.log("[socket] connected", {
      namespace: "/dispatcher",
      clientId: client.id,
      dispatcherId,
    });
  }

  handleDisconnect(client: Socket) {
    this.dispatcherServise.setStatus(client.data.dispatcherId, "OFFLINE");
    console.log("[socket] disconnected", {
      namespace: "/dispatcher",
      clientId: client.id,
      dispatcherId: client.data.dispatcherId,
    });
  }
}
