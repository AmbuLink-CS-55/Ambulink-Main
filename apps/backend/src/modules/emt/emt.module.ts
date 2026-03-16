import { Module, forwardRef } from "@nestjs/common";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { EmtApiController } from "./api/emt.api.controller";
import { EmtApiRepository } from "./api/emt.api.repository";
import { EmtApiService } from "./api/emt.api.service";
import { EmtEventsController } from "./events/emt.events.controller";
import { EmtEventsGateway } from "./events/emt.events.gateway";
import { EmtEventsRepository } from "./events/emt.events.repository";
import { EmtEventsService } from "./events/emt.events.service";
import { EmtEventsCommandService } from "./events/emt.events-command.service";

@Module({
  imports: [forwardRef(() => BookingModule), DispatcherCoreModule],
  controllers: [EmtApiController, EmtEventsController],
  providers: [
    EmtApiRepository,
    EmtApiService,
    EmtEventsRepository,
    EmtEventsService,
    EmtEventsCommandService,
    EmtEventsGateway,
  ],
  exports: [EmtApiService, EmtEventsService, EmtEventsGateway],
})
export class EmtModule {}
