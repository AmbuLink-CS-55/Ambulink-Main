import { Module } from "@nestjs/common";
import { AmbulanceApiController } from "./api/ambulance.api.controller";
import { AmbulanceApiService } from "./api/ambulance.api.service";
import { AmbulanceApiRepository } from "./api/ambulance.api.repository";
import { AmbulanceFlowRepository } from "./flow/ambulance.flow.repository";

@Module({
  controllers: [AmbulanceApiController],
  providers: [AmbulanceApiService, AmbulanceApiRepository, AmbulanceFlowRepository],
  exports: [AmbulanceApiService],
})
export class AmbulanceModule {}
