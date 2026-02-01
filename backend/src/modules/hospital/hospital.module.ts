import { Module } from "@nestjs/common"; // Fix: Import from NestJS
import { HospitalService } from "./hospital.service";

@Module({
  providers: [HospitalService],
})
export class HospitalModule {}
