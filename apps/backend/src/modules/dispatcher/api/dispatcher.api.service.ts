import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreateDispatcherDto,
  UpdateDispatcherDto,
} from "@/common/validation/schemas";
import { UserStatus } from "@/core/database/schema";
import { DispatcherApiRepository } from "./dispatcher.api.repository";

@Injectable()
export class DispatcherApiService {
  constructor(private readonly dispatcherRepository: DispatcherApiRepository) {}

  async create(createDispatcherDto: CreateDispatcherDto) {
    const [created] = await this.dispatcherRepository.createDispatcher(createDispatcherDto);
    return created;
  }

  async findAll(providerId?: string, isActive?: boolean, status?: UserStatus) {
    return this.dispatcherRepository.findAllDispatchers(providerId, isActive, status);
  }

  async findOne(id: string, providerId?: string) {
    const [dispatcher] = await this.dispatcherRepository.findDispatcherById(id);
    if (!dispatcher || !dispatcher.isActive) {
      throw new NotFoundException("Dispatcher not found");
    }
    if (providerId && dispatcher.providerId !== providerId) {
      throw new ForbiddenException("Dispatcher is outside provider scope");
    }
    return dispatcher;
  }

  async update(id: string, updateDispatcherDto: UpdateDispatcherDto, providerId?: string) {
    const existing = await this.findOne(id, providerId);
    if (
      existing.isDispatcherAdmin &&
      updateDispatcherDto.isDispatcherAdmin === false &&
      existing.providerId
    ) {
      const [admins] = await this.dispatcherRepository.countActiveAdmins(existing.providerId, id);
      if (Number(admins?.value ?? 0) === 0) {
        throw new ForbiddenException("Cannot remove the last active dispatcher admin");
      }
    }
    const [updated] = await this.dispatcherRepository.updateDispatcher(id, updateDispatcherDto);
    if (!updated) {
      throw new NotFoundException("Dispatcher not found");
    }
    return updated;
  }

  async remove(id: string, providerId?: string) {
    const existing = await this.findOne(id, providerId);
    if (existing.isDispatcherAdmin && existing.providerId) {
      const [admins] = await this.dispatcherRepository.countActiveAdmins(existing.providerId, id);
      if (Number(admins?.value ?? 0) === 0) {
        throw new ForbiddenException("Cannot remove the last active dispatcher admin");
      }
    }
    await this.dispatcherRepository.removeDispatcher(id);
  }
}
