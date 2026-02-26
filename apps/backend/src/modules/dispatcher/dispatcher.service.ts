import { Injectable } from "@nestjs/common";
import { UserStatus } from "@/common/database/schema";
import { DispatcherRepository } from "./dispatcher.repository";

@Injectable()
export class DispatcherService {
  constructor(private dispatcherRepository: DispatcherRepository) {}

  async setStatus(dispatcherId: string, status: UserStatus) {
    await this.dispatcherRepository.setDispatcherStatus(dispatcherId, status);
  }

  async findLiveDispatchersByProvider(providerId: string) {
    const dispatcher = await this.dispatcherRepository.findLiveDispatchersByProvider(providerId);
    if (dispatcher.length === 0) {
      console.warn("[DispatcherService] No AVAILABLE dispatcher found", {
        providerId,
      });
      return null;
    }
    return dispatcher[0]?.dispatcherId ?? null;
  }
}
