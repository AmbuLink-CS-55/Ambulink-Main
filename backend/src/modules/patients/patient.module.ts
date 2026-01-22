import { Module } from "@nestjs/common";
import { PatientController } from "./patient.controller";
import { PatientService } from "./patient.service";
import { DbService } from "@/database/db.service";

@Module({
  controllers: [PatientController],
  providers: [PatientService, DbService],
})
export class PatientModule {}
