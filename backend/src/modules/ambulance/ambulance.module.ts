import { Module } from "@nestjs/common";
import { AmbulanceController } from "./ambulance.controller";
import { AmbulanceService } from "./ambulance.service";
import { DbService } from "@/database/db.service";

@Module({
  controllers: [AmbulanceController],
  providers: [AmbulanceService, DbService],
})
export class AmbulanceModule {}
