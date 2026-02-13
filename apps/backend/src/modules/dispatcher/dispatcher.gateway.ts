import { Server, Socket } from "socket.io";
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import { SocketService } from "@/common/socket/socket.service";
import { DispatcherService } from "./dispatcher.service";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/dispatcher" })
export class DispatcherGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(
    private dispatcherServise: DispatcherService,
    private socketService: SocketService
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
