import { Module } from "@nestjs/common";
import { PatientController } from "./patient.controller";
import { PatientService } from "./patient.service";

import { DriverService } from "../drivers/driver.service";
import { PatientGateway } from "./patient.gateway";
import { BookingService } from "../booking/booking.service";
import { HospitalService } from "../hospital/hospital.service";
import { DispatcherService } from "../dispatcher/dispatcher.service";

@Module({
  controllers: [PatientController],
  providers: [
    PatientService,
    DriverService,
    PatientGateway,
    BookingService,
    HospitalService,
    DispatcherService,
  ],
  imports: [],
  exports: [PatientService, PatientGateway],
})
export class PatientModule {}
