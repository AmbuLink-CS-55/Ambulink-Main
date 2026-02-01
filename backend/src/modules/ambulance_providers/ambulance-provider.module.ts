import { Module } from "@nestjs/common";
import { AmbulanceProviderController } from "./ambulance-provider.controller";
import { AmbulanceProviderService } from "./ambulance-provider.service";

@Module({
  controllers: [AmbulanceProviderController],
  providers: [AmbulanceProviderService],
})
export class AmbulanceProviderModule {}
