import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { KV_STORE, type KvStore } from "./kv-store.types";

@Injectable()
export class KvStoreLifecycleService implements OnModuleDestroy {
  constructor(@Inject(KV_STORE) private kvStore: KvStore) {}

  async onModuleDestroy() {
    await this.kvStore.shutdown();
  }
}
