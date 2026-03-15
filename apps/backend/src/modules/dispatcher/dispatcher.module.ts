import { Module } from "@nestjs/common";
import { DispatcherEventsGateway } from "./events/dispatcher.events.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "./dispatcher-core.module";
import { DispatcherApiController } from "./api/dispatcher.api.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  controllers: [DispatcherApiController],
  providers: [DispatcherEventsGateway],
  imports: [DispatcherCoreModule, BookingModule, AuthModule],
  exports: [DispatcherCoreModule, DispatcherEventsGateway],
})
export class DispatcherModule {}
