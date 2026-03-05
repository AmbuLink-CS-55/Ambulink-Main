import { Module } from "@nestjs/common";
import { BookingModule } from "../booking/booking.module";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { EmtController } from "./emt.controller";
import { EmtGateway } from "./emt.gateway";
import { EmtRepository } from "./emt.repository";
import { EmtService } from "./emt.service";
import { EmtCommandService } from "./emt-command.service";

@Module({
  imports: [BookingModule, DispatcherCoreModule],
  controllers: [EmtController],
  providers: [EmtRepository, EmtService, EmtCommandService, EmtGateway],
  exports: [EmtService, EmtGateway],
})
export class EmtModule {}
