import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { BookingRepository } from "./booking.repository";
import { DriverRepository } from "../driver/driver.repository";
import { PatientRepository } from "../patient/patient.repository";
import { HospitalRepository } from "../hospital/hospital.repository";
import { BookingMediaService } from "./booking-media.service";

@Module({
  imports: [DispatcherCoreModule],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingRepository,
    BookingMediaService,
    DriverRepository,
    PatientRepository,
    HospitalRepository,
  ],
  exports: [BookingService, BookingMediaService],
})
export class BookingModule {}
