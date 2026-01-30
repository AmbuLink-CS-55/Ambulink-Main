import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { BookingService } from "../booking/booking.service";
import { DriverGateway } from "./driver.gateway";

@Module({
  controllers: [DriverController],
  providers: [
    DriverService,
    BookingService,
    DriverGateway,
  ],
  imports: [],
  exports: [DriverService, DriverGateway],
})
export class DriverModule { }
