import { Module } from "@nestjs/common";
import { AmbulanceProviderController } from "./ambulance-provider.controller";
import { AmbulanceProviderService } from "./ambulance-provider.service";
import { DbService } from "@/services/db.service";

@Module({
  controllers: [AmbulanceProviderController],
  providers: [AmbulanceProviderService, DbService],
})
export class AmbulanceProviderModule {}
