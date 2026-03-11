import { Module } from "@nestjs/common";
import { DispatcherWsGateway } from "./ws/dispatcher.ws.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "./dispatcher-core.module";

@Module({
  controllers: [],
  providers: [DispatcherWsGateway],
  imports: [DispatcherCoreModule, BookingModule],
  exports: [DispatcherCoreModule, DispatcherWsGateway],
})
export class DispatcherModule {}
