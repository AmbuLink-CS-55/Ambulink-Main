import { forwardRef, Module } from "@nestjs/common";
import { PatientController } from "./patient.controller";
import { PatientService } from "./patient.service";
import { DbService } from "@/services/db.service";

import { DriverService } from "../drivers/driver.service";
import { PatientGateway } from "./patient.gateway";
import { BookingService } from "../booking/booking.service";
import { WebsocketSessionService } from "@/services/websocket-session.service";
import { HospitalService } from "../hospital/hospital.service";
import { DriverGateway } from "../drivers/driver.gateway";
import { DriverModule } from "../drivers/driver.module";

@Module({
  controllers: [PatientController],
  providers: [
    PatientService,
    DbService,
    DriverService,
    PatientGateway,
    BookingService,
    WebsocketSessionService,
    HospitalService,
  ],
  imports: [forwardRef(() => DriverModule)],
  exports: [PatientService, PatientGateway],
})
export class PatientModule {}
