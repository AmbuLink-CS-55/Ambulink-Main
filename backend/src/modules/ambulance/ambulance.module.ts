import { Module } from "@nestjs/common";
import { AmbulanceController } from "./ambulance.controller";
import { AmbulanceService } from "./ambulance.service";
import { RedisService } from "@/database/redis.service";
import { DbService } from "@/database/db.service";

@Module({
  controllers: [AmbulanceController],
  providers: [AmbulanceService, DbService, RedisService],
})
export class AmbulanceModule {}
