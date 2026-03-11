import { Module } from "@nestjs/common";
import { BookingModule } from "../booking/booking.module";
import { DriverApiController } from "./api/driver.api.controller";
import { DriverApiService } from "./api/driver.api.service";
import { DriverApiRepository } from "./api/driver.api.repository";
import { DriverFlowController } from "./flow/driver.flow.controller";
import { DriverFlowGateway } from "./flow/driver.flow.gateway";
import { DriverFlowService } from "./flow/driver.flow.service";
import { DriverFlowRepository } from "./flow/driver.flow.repository";

@Module({
  controllers: [DriverApiController, DriverFlowController],
  providers: [
    DriverApiService,
    DriverApiRepository,
    DriverFlowGateway,
    DriverFlowService,
    DriverFlowRepository,
  ],
  imports: [BookingModule],
  exports: [DriverApiService, DriverFlowService, DriverFlowGateway],
})
export class DriverModule {}
