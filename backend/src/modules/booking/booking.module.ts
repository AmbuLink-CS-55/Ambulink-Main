import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { SocketService } from "@/common/socket/socket.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { DispatcherModule } from "../dispatcher/dispatcher.module";

@Module({
  imports: [DispatcherModule],
  providers: [BookingService],
  exports: [BookingService]
})
export class BookingModule { }
