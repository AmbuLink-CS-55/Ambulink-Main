import { Module } from "@nestjs/common";
import { DbService } from "@/database/db.service";
import { DriverService } from "../drivers/driver.service";
import { BookingService } from "./booking.service";

@Module({
  providers: [DbService, BookingService],
})
export class BookingModule {}
