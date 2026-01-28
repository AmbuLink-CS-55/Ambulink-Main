import { Module } from "@nestjs/common";
import { DbService } from "@/services/db.service";
import { BookingService } from "./booking.service";

@Module({
  providers: [DbService, BookingService],
})
export class BookingModule { }
