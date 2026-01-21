import { Module } from "@nestjs/common";
import { DbModule } from "@/database/db.module";
import { PatientController } from "./patient.controller";
import { PatientService } from "./patient.service";

@Module({
  imports: [DbModule],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
