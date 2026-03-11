import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { UserStatus } from "@/core/database/schema";
import { DbExecutor } from "@/core/database/db.service";
import { DispatcherWsRepository } from "./dispatcher.ws.repository";

@Injectable()
export class DispatcherWsService {
  constructor(private dispatcherRepository: DispatcherWsRepository) {}

  private dispatcherError(code: string, message: string) {
    return { code, message };
  }

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

  async getDispatcherContextOrThrow(dispatcherId: string, db?: DbExecutor) {
    const [dispatcher] = await this.dispatcherRepository.findDispatcherById(dispatcherId, db);
    if (!dispatcher) {
      throw new NotFoundException(
        this.dispatcherError("DISPATCHER_NOT_FOUND", "Dispatcher not found")
      );
    }

    if (!dispatcher.providerId) {
      throw new BadRequestException(
        this.dispatcherError("DISPATCHER_PROVIDER_MISSING", "Dispatcher is not attached to a provider")
      );
    }

    return {
      id: dispatcher.id,
      fullName: dispatcher.fullName,
      providerId: dispatcher.providerId,
    };
  }

  assertWithinProviderScope(bookingProviderId: string | null, dispatcherProviderId: string) {
    if (!bookingProviderId || bookingProviderId !== dispatcherProviderId) {
      throw new ForbiddenException(
        this.dispatcherError(
          "BOOKING_OUTSIDE_PROVIDER_SCOPE",
          "Dispatcher cannot access booking outside provider scope"
        )
      );
    }
  }
}
