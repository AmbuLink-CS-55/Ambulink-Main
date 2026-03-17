import { Injectable, Logger } from "@nestjs/common";
import env from "env";
import { InMemoryKvStoreService } from "./in-memory-kv-store.service";
import { RedisKvStoreService } from "./redis-kv-store.service";
import type { KvStore } from "./kv-store.types";

@Injectable()
export class KvStoreFactoryService {
  private readonly logger = new Logger(KvStoreFactoryService.name);

  constructor(
    private inMemoryKvStore: InMemoryKvStoreService,
    private redisKvStore: RedisKvStoreService
  ) {}

  async create(): Promise<KvStore> {
    if (env.REDIS_URL) {
      try {
        const healthy = await this.redisKvStore.ping();
        if (healthy) {
          this.logger.log({
            event: "kv_store_backend_selected",
            backend: "redis",
          });
          await this.redisKvStore.initialize();
          return this.redisKvStore;
        }
      } catch (error) {
        this.logger.warn({
          event: "kv_store_redis_ping_failed",
          fallback: "in_memory",
          error: (error as Error).message,
        });
      }
    }

    this.logger.warn({
      event: "kv_store_backend_selected",
      backend: "in_memory",
      reason: env.REDIS_URL ? "redis_unavailable" : "redis_url_missing",
    });
    await this.inMemoryKvStore.initialize();
    return this.inMemoryKvStore;
  }
}
