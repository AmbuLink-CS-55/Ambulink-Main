import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ namespace: "/ws" })
export class WsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("book")
  onBook(
    @MessageBody("id") id: number,
    @ConnectedSocket() client: Socket
  ): string {
    return "Hello world!";
  }
}
