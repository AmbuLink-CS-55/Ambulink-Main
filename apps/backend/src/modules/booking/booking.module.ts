import { Module } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { BookingRepository } from "./booking.repository";
import { DriverRepository } from "../driver/driver.repository";
import { PatientRepository } from "../patient/patient.repository";
import { HospitalRepository } from "../hospital/hospital.repository";

@Module({
  imports: [DispatcherCoreModule],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingRepository,
    DriverRepository,
    PatientRepository,
    HospitalRepository,
  ],
  exports: [BookingService],
})
export class BookingModule {}
