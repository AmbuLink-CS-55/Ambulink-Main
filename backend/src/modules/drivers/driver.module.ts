import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DbService } from "@/database/db.service";
import { BookingService } from "../booking/booking.service";
import { DriverGateway } from "./driver.gateway";
import { WebsocketSessionService } from "@/services/websocket-session.service";

@Module({
  controllers: [DriverController],
  providers: [DriverService, DbService,BookingService, DriverGateway, WebsocketSessionService],
})
export class DriverModule {}
