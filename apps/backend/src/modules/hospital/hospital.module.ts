import { Module } from "@nestjs/common";
import { HospitalApiService } from "./api/hospital.api.service";
import { HospitalApiController } from "./api/hospital.api.controller";
import { HospitalApiRepository } from "./api/hospital.api.repository";
import { HospitalFlowService } from "./flow/hospital.flow.service";
import { HospitalFlowRepository } from "./flow/hospital.flow.repository";

@Module({
  controllers: [HospitalApiController],
  providers: [
    HospitalApiService,
    HospitalApiRepository,
    HospitalFlowService,
    HospitalFlowRepository,
  ],
  exports: [HospitalApiService, HospitalFlowService],
})
export class HospitalModule {}
