import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { ambulance } from "../../db/schema";
import type {
  InsertAmbulanceDto,
  SelectAmbulanceDto,
} from "../../db/schemas/ambulance.schema";

@Injectable()
export class AmbulanceService {
  constructor(private db: DbService) {}

  async create(
    createAmbulanceDto: InsertAmbulanceDto
  ): Promise<SelectAmbulanceDto> {
    const result = await this.db
      .getDb()
      .insert(ambulance)
      .values(createAmbulanceDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<SelectAmbulanceDto[]> {
    return this.db.getDb().select().from(ambulance);
  }

  async findOne(id: number): Promise<SelectAmbulanceDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(ambulance)
      .where(eq(ambulance.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: number,
    updateAmbulanceDto: Partial<InsertAmbulanceDto>
  ): Promise<SelectAmbulanceDto> {
    const result = await this.db
      .getDb()
      .update(ambulance)
      .set(updateAmbulanceDto)
      .where(eq(ambulance.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.db.getDb().delete(ambulance).where(eq(ambulance.id, id));
  }
}
