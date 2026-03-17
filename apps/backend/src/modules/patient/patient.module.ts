import { Module, forwardRef } from "@nestjs/common";
import { DriverModule } from "../driver/driver.module";
import { BookingModule } from "../booking/booking.module";
import { HospitalModule } from "../hospital/hospital.module";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { PatientApiController } from "./api/patient.api.controller";
import { PatientApiService } from "./api/patient.api.service";
import { PatientApiRepository } from "./api/patient.api.repository";
import { PatientEventsController } from "./events/patient.events.controller";
import { PatientEventsGateway } from "./events/patient.events.gateway";
import { PatientEventsService } from "./events/patient.events.service";
import { PatientEventsRepository } from "./events/patient.events.repository";

@Module({
  controllers: [PatientApiController, PatientEventsController],
  providers: [
    PatientApiService,
    PatientApiRepository,
    PatientEventsGateway,
    PatientEventsService,
    PatientEventsRepository,
  ],
  imports: [DriverModule, forwardRef(() => BookingModule), HospitalModule, DispatcherCoreModule],
  exports: [PatientApiService, PatientEventsService, PatientEventsGateway],
})
export class PatientModule {}
