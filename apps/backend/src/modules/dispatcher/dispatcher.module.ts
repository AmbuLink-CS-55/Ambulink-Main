import { Module } from "@nestjs/common";
import { DispatcherFlowGateway } from "./flow/dispatcher.flow.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "./dispatcher-core.module";

@Module({
  controllers: [],
  providers: [DispatcherFlowGateway],
  imports: [DispatcherCoreModule, BookingModule],
  exports: [DispatcherCoreModule, DispatcherFlowGateway],
})
export class DispatcherModule {}
