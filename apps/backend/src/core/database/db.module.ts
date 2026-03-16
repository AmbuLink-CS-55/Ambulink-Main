import { Global, Module } from "@nestjs/common";
import { DbService } from "./db.service";
import { InMemoryKvStoreService } from "./in-memory-kv-store.service";
import { RedisKvStoreService } from "./redis-kv-store.service";
import { KvStoreFactoryService } from "./kv-store.factory.service";
import { KvStoreLifecycleService } from "./kv-store.lifecycle.service";
import { KV_STORE } from "./kv-store.types";

@Global()
@Module({
  providers: [
    DbService,
    InMemoryKvStoreService,
    RedisKvStoreService,
    KvStoreFactoryService,
    {
      provide: KV_STORE,
      useFactory: (factory: KvStoreFactoryService) => factory.create(),
      inject: [KvStoreFactoryService],
    },
    KvStoreLifecycleService,
  ],
  exports: [DbService, KV_STORE],
})
export class DbModule {}
