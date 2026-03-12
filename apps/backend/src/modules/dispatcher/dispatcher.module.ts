import { Module } from "@nestjs/common";
import { DispatcherEventsGateway } from "./events/dispatcher.events.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "./dispatcher-core.module";

@Module({
  controllers: [],
  providers: [DispatcherEventsGateway],
  imports: [DispatcherCoreModule, BookingModule],
  exports: [DispatcherCoreModule, DispatcherEventsGateway],
})
export class DispatcherModule {}
