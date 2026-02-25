import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DriverGateway } from "./driver.gateway";
import { DriverCommandService } from "./driver-command.service";
import { BookingModule } from "../booking/booking.module";

@Module({
  controllers: [DriverController],
  providers: [DriverService, DriverGateway, DriverCommandService],
  imports: [BookingModule],
  exports: [DriverService, DriverGateway],
})
export class DriverModule {}
