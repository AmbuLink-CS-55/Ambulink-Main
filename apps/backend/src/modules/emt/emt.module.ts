import { Module } from "@nestjs/common";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { EmtApiController } from "./api/emt.api.controller";
import { EmtApiRepository } from "./api/emt.api.repository";
import { EmtApiService } from "./api/emt.api.service";
import { EmtFlowController } from "./flow/emt.flow.controller";
import { EmtFlowGateway } from "./flow/emt.flow.gateway";
import { EmtFlowRepository } from "./flow/emt.flow.repository";
import { EmtFlowService } from "./flow/emt.flow.service";
import { EmtFlowCommandService } from "./flow/emt.flow-command.service";

@Module({
  imports: [BookingModule, DispatcherCoreModule],
  controllers: [EmtApiController, EmtFlowController],
  providers: [
    EmtApiRepository,
    EmtApiService,
    EmtFlowRepository,
    EmtFlowService,
    EmtFlowCommandService,
    EmtFlowGateway,
  ],
  exports: [EmtApiService, EmtFlowService, EmtFlowGateway],
})
export class EmtModule {}
