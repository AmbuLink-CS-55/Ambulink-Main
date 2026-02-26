import { Module } from "@nestjs/common";
import { AmbulanceProviderController } from "./ambulance-provider.controller";
import { AmbulanceProviderService } from "./ambulance-provider.service";
import { AmbulanceProviderRepository } from "./ambulance-provider.repository";

@Module({
  controllers: [AmbulanceProviderController],
  providers: [AmbulanceProviderService, AmbulanceProviderRepository],
})
export class AmbulanceProviderModule {}
