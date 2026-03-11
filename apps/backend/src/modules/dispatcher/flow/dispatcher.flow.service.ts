import { Injectable } from "@nestjs/common";
import { UserStatus } from "@/core/database/schema";
import { DispatcherFlowRepository } from "./dispatcher.flow.repository";

@Injectable()
export class DispatcherFlowService {
  constructor(private dispatcherRepository: DispatcherFlowRepository) {}

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

  async findAllLiveDispatchersByProvider(providerId: string) {
    const dispatchers =
      await this.dispatcherRepository.findAllLiveDispatchersByProvider(providerId);
    return dispatchers.map((dispatcher) => dispatcher.dispatcherId);
  }
}
