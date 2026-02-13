import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { DispatcherModule } from "../dispatcher/dispatcher.module";

@Module({
  imports: [DispatcherModule],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
