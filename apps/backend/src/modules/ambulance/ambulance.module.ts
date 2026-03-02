import { Module } from "@nestjs/common";
import { AmbulanceController } from "./ambulance.controller";
import { AmbulanceService } from "./ambulance.service";
import { AmbulanceRepository } from "./ambulance.repository";

@Module({
  controllers: [AmbulanceController],
  providers: [AmbulanceService, AmbulanceRepository],
})
export class AmbulanceModule {}
