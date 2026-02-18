import { Module, forwardRef } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { DispatcherModule } from "../dispatcher/dispatcher.module";

@Module({
  imports: [forwardRef(() => DispatcherModule)],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
