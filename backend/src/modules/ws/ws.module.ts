import { Module } from "@nestjs/common";
import { WsGateway } from "./gateways/ws/ws.gateway";

@Module({
  providers: [WsGateway],
})
export class WsModule {}
