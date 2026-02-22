import { Injectable, NotFoundException } from "@nestjs/common";
import { Ambulance } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import { SocketService } from "@/common/socket/socket.service";
import type { CreateAmbulanceDto, UpdateAmbulanceDto } from "@/common/validation/schemas";
import {
  createAmbulance,
  getAllAmbulances,
  getAmbulanceById,
  updateAmbulance,
  deleteAmbulance,
} from "@/common/queries";

@Injectable()
export class AmbulanceService {
  constructor(
    private dbService: DbService,
    private socketService: SocketService
  ) {}

  async create(createAmbulanceDto: CreateAmbulanceDto) {
    const result = await createAmbulance(this.dbService.db, createAmbulanceDto);
    const created = result[0];
    if (created) {
      this.socketService.emitToAllDispatchers("ambulance:update", {
        providerId: created.providerId,
        ambulance: created,
        action: "created",
      });
    }
    return created;
  }

  async findAll(providerId?: string) {
    return getAllAmbulances(this.dbService.db, providerId);
  }

  async findOne(id: string) {
    const result = await getAmbulanceById(this.dbService.db, id);
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updateAmbulanceDto: UpdateAmbulanceDto) {
    const result = await updateAmbulance(this.dbService.db, id, updateAmbulanceDto);
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    const updated = result[0];
    if (updated) {
      this.socketService.emitToAllDispatchers("ambulance:update", {
        providerId: updated.providerId,
        ambulance: updated,
        action: "updated",
      });
    }
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    await deleteAmbulance(this.dbService.db, id);
  }
}
