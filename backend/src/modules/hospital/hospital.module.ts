import { Module } from "@nestjs/common"; // Fix: Import from NestJS
import { DbService } from "@/services/db.service";
import { HospitalService } from "./hospital.service";

@Module({
  controllers: [],
  providers: [HospitalService, DbService],
})
export class HospitalModule {}
