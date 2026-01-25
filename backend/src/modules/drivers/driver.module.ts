import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DbService } from "@/database/db.service";
import { RedisService } from "@/database/redis.service";
import { BookingService } from "../booking/booking.service";

@Module({
  controllers: [DriverController],
  providers: [DriverService, DbService, RedisService, BookingService],
})
export class DriverModule {}
