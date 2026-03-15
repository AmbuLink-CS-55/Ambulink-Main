import { Module } from "@nestjs/common";
import { DispatcherEventsGateway } from "./events/dispatcher.events.gateway";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "./dispatcher-core.module";
import { DispatcherApiController } from "./api/dispatcher.api.controller";
import { AuthModule } from "../auth/auth.module";
import { DispatcherApiService } from "./api/dispatcher.api.service";
import { DispatcherApiRepository } from "./api/dispatcher.api.repository";

@Module({
  controllers: [DispatcherApiController],
  providers: [DispatcherEventsGateway, DispatcherApiService, DispatcherApiRepository],
  imports: [DispatcherCoreModule, BookingModule, AuthModule],
  exports: [DispatcherCoreModule, DispatcherEventsGateway],
})
export class DispatcherModule {}
