import { Module } from "@nestjs/common";
import { AmbulanceProviderApiController } from "./api/ambulance-provider.api.controller";
import { AmbulanceProviderApiService } from "./api/ambulance-provider.api.service";
import { AmbulanceProviderApiRepository } from "./api/ambulance-provider.api.repository";

@Module({
  controllers: [AmbulanceProviderApiController],
  providers: [
    AmbulanceProviderApiService,
    AmbulanceProviderApiRepository,
  ],
  exports: [AmbulanceProviderApiService],
})
export class AmbulanceProviderModule {}
