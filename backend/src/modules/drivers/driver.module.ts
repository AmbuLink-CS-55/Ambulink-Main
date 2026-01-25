import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DbService } from "@/database/db.service";
import { RedisService } from "@/database/redis.service";
import { BookingService } from "../booking/booking.service";
import { driverGateway } from "./driver.gateway";

@Module({
  controllers: [DriverController],
  providers: [DriverService, DbService, RedisService, BookingService, driverGateway],
})
export class DriverModule {}
