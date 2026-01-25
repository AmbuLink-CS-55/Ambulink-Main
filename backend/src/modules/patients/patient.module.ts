import { Module } from "@nestjs/common";
import { PatientController } from "./patient.controller";
import { PatientService } from "./patient.service";
import { DbService } from "@/database/db.service";
import { RedisService } from "@/database/redis.service";
import { DriverService } from "../drivers/driver.service";
import { PatientGateway } from "./patient.gateway";
import { BookingService } from "../booking/booking.service";

@Module({
  controllers: [PatientController],
  providers: [
    PatientService,
    DbService,
    RedisService,
    DriverService,
    PatientGateway,
    BookingService
  ],
})
export class PatientModule {}
