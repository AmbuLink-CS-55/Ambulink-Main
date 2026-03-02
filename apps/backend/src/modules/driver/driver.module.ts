import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DriverGateway } from "./driver.gateway";
import { DriverCommandService } from "./driver-command.service";
import { BookingModule } from "../booking/booking.module";
import { DriverRepository } from "./driver.repository";

@Module({
  controllers: [DriverController],
  providers: [DriverService, DriverGateway, DriverCommandService, DriverRepository],
  imports: [BookingModule],
  exports: [DriverService, DriverGateway],
})
export class DriverModule {}
