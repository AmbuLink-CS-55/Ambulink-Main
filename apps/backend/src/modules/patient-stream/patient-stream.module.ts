import { Module } from "@nestjs/common";
import { PatientStreamController } from "./patient-stream.controller";
import { PatientStreamService } from "./patient-stream.service";
import { PatientStreamListener } from "./patient-stream.listener";

@Module({
  controllers: [PatientStreamController],
  providers: [PatientStreamService, PatientStreamListener],
  exports: [PatientStreamService],
})
export class PatientStreamModule {}
