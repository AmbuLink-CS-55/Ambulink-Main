import { Module, forwardRef } from "@nestjs/common";
import { BookingModule } from "../booking/booking.module";
import { DriverApiController } from "./api/driver.api.controller";
import { DriverApiService } from "./api/driver.api.service";
import { DriverApiRepository } from "./api/driver.api.repository";
import { DriverEventsController } from "./events/driver.events.controller";
import { DriverEventsGateway } from "./events/driver.events.gateway";
import { DriverEventsService } from "./events/driver.events.service";
import { DriverEventsRepository } from "./events/driver.events.repository";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";

@Module({
  controllers: [DriverApiController, DriverEventsController],
  providers: [
    DriverApiService,
    DriverApiRepository,
    DriverEventsGateway,
    DriverEventsService,
    DriverEventsRepository,
  ],
  imports: [forwardRef(() => BookingModule), DispatcherCoreModule],
  exports: [DriverApiService, DriverEventsService, DriverEventsGateway],
})
export class DriverModule {}
