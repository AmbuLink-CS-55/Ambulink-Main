import { Module } from "@nestjs/common";
import { DriverModule } from "../driver/driver.module";
import { BookingModule } from "../booking/booking.module";
import { HospitalModule } from "../hospital/hospital.module";
import { PatientApiController } from "./api/patient.api.controller";
import { PatientApiService } from "./api/patient.api.service";
import { PatientApiRepository } from "./api/patient.api.repository";
import { PatientFlowController } from "./flow/patient.flow.controller";
import { PatientFlowGateway } from "./flow/patient.flow.gateway";
import { PatientFlowService } from "./flow/patient.flow.service";
import { PatientFlowRepository } from "./flow/patient.flow.repository";

@Module({
  controllers: [PatientApiController, PatientFlowController],
  providers: [
    PatientApiService,
    PatientApiRepository,
    PatientFlowGateway,
    PatientFlowService,
    PatientFlowRepository,
  ],
  imports: [DriverModule, BookingModule, HospitalModule],
  exports: [PatientApiService, PatientFlowService, PatientFlowGateway],
})
export class PatientModule {}
