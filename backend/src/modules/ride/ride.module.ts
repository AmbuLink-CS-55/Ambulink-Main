import { Module } from "@nestjs/common";
import { RideGateway } from "./ride.gateway";
import { DbService } from "@/database/db.service";
import { RedisService } from "@/database/redis.service";

@Module({
  providers: [RedisService, RideGateway, DbService],
})
export class WsModule {}
