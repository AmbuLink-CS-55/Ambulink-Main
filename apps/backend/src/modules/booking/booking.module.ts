import { Module, forwardRef } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { BookingController } from "./booking.controller";
import { DispatcherModule } from "../dispatcher/dispatcher.module";
import { BookingRepository } from "./booking.repository";
import { DriverRepository } from "../drivers/driver.repository";
import { PatientRepository } from "../patients/patient.repository";
import { HospitalRepository } from "../hospital/hospital.repository";

@Module({
  imports: [forwardRef(() => DispatcherModule)],
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
