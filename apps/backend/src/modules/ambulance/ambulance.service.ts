import { Injectable, NotFoundException } from "@nestjs/common";
import type { CreateAmbulanceDto, UpdateAmbulanceDto } from "@/common/validation/schemas";
import { AmbulanceRepository } from "./ambulance.repository";
import { EventBusService } from "@/core/events/event-bus.service";

@Injectable()
export class AmbulanceService {
  constructor(
    private ambulanceRepository: AmbulanceRepository,
    private eventBus: EventBusService
  ) {}

  async create(createAmbulanceDto: CreateAmbulanceDto) {
    const result = await this.ambulanceRepository.createAmbulance(createAmbulanceDto);
    const created = result[0];
    if (created) {
      this.eventBus.publish({
        type: "realtime.dispatchers",
        event: "ambulance:update",
        payload: {
          providerId: created.providerId,
          ambulance: created,
          action: "created",
        },
      });
    }
    return created;
  }

  async findAll(providerId?: string) {
    return this.ambulanceRepository.getAllAmbulances(providerId);
  }

  async findOne(id: string) {
    const result = await this.ambulanceRepository.getAmbulanceById(id);
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updateAmbulanceDto: UpdateAmbulanceDto) {
    const result = await this.ambulanceRepository.updateAmbulance(id, updateAmbulanceDto);
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    const updated = result[0];
    if (updated) {
      this.eventBus.publish({
        type: "realtime.dispatchers",
        event: "ambulance:update",
        payload: {
          providerId: updated.providerId,
          ambulance: updated,
          action: "updated",
        },
      });
    }
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    await this.ambulanceRepository.deleteAmbulance(id);
  }
}
