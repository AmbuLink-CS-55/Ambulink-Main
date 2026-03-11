import { Module } from "@nestjs/common";
import { HospitalApiService } from "./api/hospital.api.service";
import { HospitalApiController } from "./api/hospital.api.controller";
import { HospitalApiRepository } from "./api/hospital.api.repository";
import { HospitalWsService } from "./ws/hospital.ws.service";
import { HospitalWsRepository } from "./ws/hospital.ws.repository";

@Module({
  controllers: [HospitalApiController],
  providers: [
    HospitalApiService,
    HospitalApiRepository,
    HospitalWsService,
    HospitalWsRepository,
  ],
  exports: [HospitalApiService, HospitalWsService],
})
export class HospitalModule {}
