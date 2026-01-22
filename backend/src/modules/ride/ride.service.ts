import { RedisService } from "@/database/redis.service";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import Redis from "ioredis";
import { string } from "node_modules/zod/v4/core/regexes";
import { DbService } from "src/database/db.service";

@Injectable()
export class RiverService {
  private redisClient: Redis;

  constructor(
    private db: DbService,
    private redis: RedisService
  ) {
    this.redisClient = this.redis.getClient()
  }


}
