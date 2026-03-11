import { Module, forwardRef } from "@nestjs/common";
import { BookingModule } from "../booking/booking.module";
import { DriverApiController } from "./api/driver.api.controller";
import { DriverApiService } from "./api/driver.api.service";
import { DriverApiRepository } from "./api/driver.api.repository";
import { DriverWsController } from "./ws/driver.ws.controller";
import { DriverWsGateway } from "./ws/driver.ws.gateway";
import { DriverWsService } from "./ws/driver.ws.service";
import { DriverWsRepository } from "./ws/driver.ws.repository";

@Module({
  controllers: [DriverApiController, DriverWsController],
  providers: [
    DriverApiService,
    DriverApiRepository,
    DriverWsGateway,
    DriverWsService,
    DriverWsRepository,
  ],
  imports: [forwardRef(() => BookingModule)],
  exports: [DriverApiService, DriverWsService, DriverWsGateway],
})
export class DriverModule {}
