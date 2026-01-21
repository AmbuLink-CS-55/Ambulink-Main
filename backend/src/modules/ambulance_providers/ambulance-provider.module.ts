import { Module } from "@nestjs/common";
import { DbModule } from "@/database/db.module";
import { AmbulanceProviderController } from "./ambulance-provider.controller";
import { AmbulanceProviderService } from "./ambulance-provider.service";

@Module({
  imports: [DbModule],
  controllers: [AmbulanceProviderController],
  providers: [AmbulanceProviderService],
})
export class AmbulanceProviderModule {}
