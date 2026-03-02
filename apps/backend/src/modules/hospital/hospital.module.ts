import { Module } from "@nestjs/common"; // Fix: Import from NestJS
import { HospitalService } from "./hospital.service";
import { HospitalController } from "./hospital.controller";
import { HospitalRepository } from "./hospital.repository";

@Module({
  controllers: [HospitalController],
  providers: [HospitalService, HospitalRepository],
  exports: [HospitalService],
})
export class HospitalModule {}
