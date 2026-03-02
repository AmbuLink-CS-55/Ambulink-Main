import { Module } from "@nestjs/common";
import { DispatcherGateway } from "./dispatcher.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "./dispatcher-core.module";

@Module({
  controllers: [],
  providers: [DispatcherGateway],
  imports: [DispatcherCoreModule, BookingModule],
  exports: [DispatcherCoreModule, DispatcherGateway],
})
export class DispatcherModule {}
