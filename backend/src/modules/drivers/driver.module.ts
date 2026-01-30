import { forwardRef, Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { BookingService } from "../booking/booking.service";
import { DriverGateway } from "./driver.gateway";
import { PatientGateway } from "../patients/patient.gateway";
import { PatientModule } from "../patients/patient.module";
import { SocketService } from "@/services/socket.service";

@Module({
  controllers: [DriverController],
  providers: [
    DriverService,
    BookingService,
    SocketService,
    DriverGateway,
  ],
  imports: [forwardRef(() => PatientModule)],
  exports: [DriverService, DriverGateway],
})
export class DriverModule { }
