import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { ambulance } from "../../db/schema";
import { CreateAmbulanceDto } from "./dto/create-ambulance.dto";
import { UpdateAmbulanceDto } from "./dto/update-ambulance.dto";
import { AmbulanceResponseDto } from "./dto/ambulance-response.dto";

@Injectable()
export class AmbulanceService {
  constructor(private db: DbService) { }

  async create(
    createAmbulanceDto: CreateAmbulanceDto
  ): Promise<AmbulanceResponseDto> {
    const result = await this.db
      .getDb()
      .insert(ambulance)
      .values(createAmbulanceDto as any)
      .returning();
    return result[0];
  }

  async findAll(): Promise<AmbulanceResponseDto[]> {
    return this.db.getDb().select().from(ambulance);
  }

  async findOne(id: number): Promise<AmbulanceResponseDto> {
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
    updateAmbulanceDto: UpdateAmbulanceDto
  ): Promise<AmbulanceResponseDto> {
    const result = await this.db
      .getDb()
      .update(ambulance)
      .set(updateAmbulanceDto as any)
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
