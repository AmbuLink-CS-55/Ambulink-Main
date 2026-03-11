import { Module, forwardRef } from "@nestjs/common";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { EmtApiController } from "./api/emt.api.controller";
import { EmtApiRepository } from "./api/emt.api.repository";
import { EmtApiService } from "./api/emt.api.service";
import { EmtWsController } from "./ws/emt.ws.controller";
import { EmtWsGateway } from "./ws/emt.ws.gateway";
import { EmtWsRepository } from "./ws/emt.ws.repository";
import { EmtWsService } from "./ws/emt.ws.service";
import { EmtWsCommandService } from "./ws/emt.ws-command.service";

@Module({
  imports: [forwardRef(() => BookingModule), DispatcherCoreModule],
  controllers: [EmtApiController, EmtWsController],
  providers: [
    EmtApiRepository,
    EmtApiService,
    EmtWsRepository,
    EmtWsService,
    EmtWsCommandService,
    EmtWsGateway,
  ],
  exports: [EmtApiService, EmtWsService, EmtWsGateway],
})
export class EmtModule {}
