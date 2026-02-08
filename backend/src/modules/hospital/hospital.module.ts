import { Module } from "@nestjs/common"; // Fix: Import from NestJS
import { HospitalService } from "./hospital.service";
import { HospitalController } from "./hospital.controller";

@Module({
    controllers: [HospitalController],
  providers: [HospitalService],
})
export class HospitalModule {}
