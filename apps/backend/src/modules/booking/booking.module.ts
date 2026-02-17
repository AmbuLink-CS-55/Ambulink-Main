import { Module, forwardRef } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { DispatcherModule } from "../dispatcher/dispatcher.module";

@Module({
  imports: [forwardRef(() => DispatcherModule)],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
