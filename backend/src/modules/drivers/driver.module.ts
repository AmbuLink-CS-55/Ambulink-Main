import { forwardRef, Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DbService } from "@/services/db.service";
import { BookingService } from "../booking/booking.service";
import { DriverGateway } from "./driver.gateway";
import { WebsocketSessionService } from "@/services/websocket-session.service";
import { PatientGateway } from "../patients/patient.gateway";
import { PatientModule } from "../patients/patient.module";

@Module({
  controllers: [DriverController],
  providers: [
    DriverService,
    DbService,
    BookingService,
    DriverGateway,
    WebsocketSessionService,
  ],
  imports: [forwardRef(() => PatientModule)],
  exports: [DriverService, DriverGateway],
})
export class DriverModule {}
