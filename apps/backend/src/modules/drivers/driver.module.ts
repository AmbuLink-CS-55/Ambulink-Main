import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { BookingService } from "../booking/booking.service";
import { DriverGateway } from "./driver.gateway";
import { DispatcherModule } from "../dispatcher/dispatcher.module";

@Module({
  controllers: [DriverController],
  providers: [DriverService, BookingService, DriverGateway],
  imports: [DispatcherModule],
  exports: [DriverService, DriverGateway],
})
export class DriverModule {}
