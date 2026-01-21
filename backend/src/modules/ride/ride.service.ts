import { RedisService } from "@/database/redis.service";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import Redis from "ioredis";
import { DbService } from "src/database/db.service";

@Injectable()
export class DriverService {
  constructor(
    private db: DbService,
    private redis: RedisService
  ) {}
}
