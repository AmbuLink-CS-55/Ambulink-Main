import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class WsGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log("Connected to ", client.id);
  }

  @SubscribeMessage("patient-location")
  handlePatientLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ) {
    console.log("Patient location:", data);
    this.server.emit("location-update", data);
  }

  @SubscribeMessage("help")
  handleHelp(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log("Help request from:", client.id, ", location:", data);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.server.emit("help-request", { clientId: client.id, data });
  }
}
