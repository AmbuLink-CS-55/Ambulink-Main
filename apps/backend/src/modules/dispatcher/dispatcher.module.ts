import { Module, forwardRef } from "@nestjs/common";
import { DispatcherService } from "./dispatcher.service";
import { DispatcherGateway } from "./dispatcher.gateway";
import { BookingModule } from "../booking/booking.module";

@Module({
  controllers: [],
  providers: [DispatcherService, DispatcherGateway],
  imports: [forwardRef(() => BookingModule)],
  exports: [DispatcherService, DispatcherGateway],
})
export class DispatcherModule {}
