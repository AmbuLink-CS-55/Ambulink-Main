import { Module } from "@nestjs/common";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { DriverFlowRepository } from "../driver/flow/driver.flow.repository";
import { PatientFlowRepository } from "../patient/flow/patient.flow.repository";
import { HospitalFlowRepository } from "../hospital/flow/hospital.flow.repository";
import { BookingMediaService } from "./booking-media.service";
import { BookingApiController } from "./api/booking.api.controller";
import { BookingApiService } from "./api/booking.api.service";
import { BookingFlowService } from "./flow/booking.flow.service";
import { BookingCoreService } from "./common/booking.core.service";
import { BookingSharedRepository } from "./common/booking.shared.repository";

@Module({
  imports: [DispatcherCoreModule],
  controllers: [BookingApiController],
  providers: [
    BookingSharedRepository,
    BookingCoreService,
    BookingApiService,
    BookingFlowService,
    BookingMediaService,
    DriverFlowRepository,
    PatientFlowRepository,
    HospitalFlowRepository,
  ],
  exports: [BookingApiService, BookingFlowService, BookingMediaService],
})
export class BookingModule {}
