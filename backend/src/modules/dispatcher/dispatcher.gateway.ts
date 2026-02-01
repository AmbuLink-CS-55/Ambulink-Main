import { Server, Socket } from "socket.io";
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import { SocketService } from "@/common/socket/socket.service";
import { DispatcherService } from "./dispatcher.service";

type PickupRequest = {
  patientId: string;
  lat: number;
  lng: number;
};

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/dispatcher" })
export class DispatcherGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(
    private dispatcherServise: DispatcherService,
    private socketService: SocketService) { }

  afterInit() {
    this.socketService.dispatcherServer = this.server;
  }

  handleConnection(client: Socket) {
    const dispatcherId = client.handshake.auth.dispatcherId as string;
    if (!dispatcherId) return client.disconnect(true);
    client.data.dispatcherId = dispatcherId;
    this.dispatcherServise.setStatus(dispatcherId, "AVAILABLE");
    client.join(`dispatcher:${dispatcherId}`);
  }

  handleDisconnect(client: Socket) {
    this.dispatcherServise.setStatus(client.data.dispatcherId, "OFFLINE");
  }
}
