import { Module } from "@nestjs/common";
import { AmbulanceApiController } from "./api/ambulance.api.controller";
import { AmbulanceApiService } from "./api/ambulance.api.service";
import { AmbulanceApiRepository } from "./api/ambulance.api.repository";

@Module({
  controllers: [AmbulanceApiController],
  providers: [AmbulanceApiService, AmbulanceApiRepository],
  exports: [AmbulanceApiService],
})
export class AmbulanceModule {}
