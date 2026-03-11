import { Module, forwardRef } from "@nestjs/common";
import { DriverModule } from "../driver/driver.module";
import { BookingModule } from "../booking/booking.module";
import { HospitalModule } from "../hospital/hospital.module";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { PatientApiController } from "./api/patient.api.controller";
import { PatientApiService } from "./api/patient.api.service";
import { PatientApiRepository } from "./api/patient.api.repository";
import { PatientWsController } from "./ws/patient.ws.controller";
import { PatientWsGateway } from "./ws/patient.ws.gateway";
import { PatientWsService } from "./ws/patient.ws.service";
import { PatientWsRepository } from "./ws/patient.ws.repository";

@Module({
  controllers: [PatientApiController, PatientWsController],
  providers: [
    PatientApiService,
    PatientApiRepository,
    PatientWsGateway,
    PatientWsService,
    PatientWsRepository,
  ],
  imports: [DriverModule, forwardRef(() => BookingModule), HospitalModule, DispatcherCoreModule],
  exports: [PatientApiService, PatientWsService, PatientWsGateway],
})
export class PatientModule {}
