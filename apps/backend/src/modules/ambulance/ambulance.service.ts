import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { Ambulance, ambulance } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import { SocketService } from "@/common/socket/socket.service";
import type { CreateAmbulanceDto, UpdateAmbulanceDto } from "@/common/validation/schemas";

@Injectable()
export class AmbulanceService {
  constructor(
    private dbService: DbService,
    private socketService: SocketService
  ) {}

  async create(createAmbulanceDto: CreateAmbulanceDto): Promise<Ambulance> {
    const result = await this.dbService.db.insert(ambulance).values(createAmbulanceDto).returning();
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

  async findAll(providerId?: string): Promise<Ambulance[]> {
    if (!providerId) {
      return this.dbService.db.select().from(ambulance);
    }
    return this.dbService.db.select().from(ambulance).where(eq(ambulance.providerId, providerId));
  }

  async findOne(id: string): Promise<Ambulance> {
    const result = await this.dbService.db.select().from(ambulance).where(eq(ambulance.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updateAmbulanceDto: UpdateAmbulanceDto): Promise<Ambulance> {
    const result = await this.dbService.db
      .update(ambulance)
      .set(updateAmbulanceDto)
      .where(eq(ambulance.id, id))
      .returning();
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

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.dbService.db.delete(ambulance).where(eq(ambulance.id, id));
  }
}
