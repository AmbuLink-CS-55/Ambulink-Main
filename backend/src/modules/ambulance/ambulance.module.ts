import { Module } from "@nestjs/common";
import { DbModule } from "@/database/db.module";
import { AmbulanceController } from "./ambulance.controller";
import { AmbulanceService } from "./ambulance.service";

@Module({
  imports: [DbModule],
  controllers: [AmbulanceController],
  providers: [AmbulanceService],
})
export class AmbulanceModule {}
