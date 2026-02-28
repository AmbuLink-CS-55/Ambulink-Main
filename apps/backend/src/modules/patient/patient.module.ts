import { Module } from "@nestjs/common";
import { PatientController } from "./patient.controller";
import { PatientService } from "./patient.service";
import { PatientGateway } from "./patient.gateway";
import { PatientCommandService } from "./patient-command.service";
import { DriverModule } from "../driver/driver.module";
import { BookingModule } from "../booking/booking.module";
import { HospitalModule } from "../hospital/hospital.module";
import { PatientRepository } from "./patient.repository";

@Module({
  controllers: [PatientController],
  providers: [PatientService, PatientGateway, PatientCommandService, PatientRepository],
  imports: [DriverModule, BookingModule, HospitalModule],
  exports: [PatientService, PatientGateway],
})
export class PatientModule {}
