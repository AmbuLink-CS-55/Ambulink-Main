import { Injectable } from "@nestjs/common";
import { DbService } from "@/common/database/db.service";
import { UserStatus } from "@/common/database/schema";
import { setDispatcherStatus, findLiveDispatchersByProvider } from "@/common/queries";

@Injectable()
export class DispatcherService {
  constructor(private dbService: DbService) {}

  async setStatus(dispatcherId: string, status: UserStatus) {
    await setDispatcherStatus(this.dbService.db, dispatcherId, status);
  }

  async findLiveDispatchersByProvider(providerId: string) {
    const dispatcher = await findLiveDispatchersByProvider(this.dbService.db, providerId);
    if (dispatcher.length === 0) {
      console.warn("[DispatcherService] No AVAILABLE dispatcher found", {
        providerId,
      });
      return null;
    }
    return dispatcher[0]?.dispatcherId ?? null;
  }
}
