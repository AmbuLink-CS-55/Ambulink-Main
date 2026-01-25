import { Module } from "@nestjs/common";
import { DbService } from "@/database/db.service";
import { RedisService } from "@/database/redis.service";
import { DriverService } from "../drivers/driver.service";
import { BookingService } from "./booking.service";

@Module({
  providers: [DbService, RedisService, BookingService],
})
export class BookingModule {}
