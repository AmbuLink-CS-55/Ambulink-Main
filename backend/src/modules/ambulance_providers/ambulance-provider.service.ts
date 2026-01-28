import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "@/services/db.service";
import { ambulanceProviders } from "@/database/schema";
import type {
  InsertAmbulanceProviderDto,
  SelectAmbulanceProviderDto,
} from "@/common/dto/ambulance-provider.schema";

@Injectable()
export class AmbulanceProviderService {
  constructor(private db: DbService) {}

  async create(
    createAmbulanceProviderDto: InsertAmbulanceProviderDto
  ): Promise<SelectAmbulanceProviderDto> {
    const result = await this.db
      .getDb()
      .insert(ambulanceProviders)
      .values(createAmbulanceProviderDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<SelectAmbulanceProviderDto[]> {
    return this.db.getDb().select().from(ambulanceProviders);
  }

  async findOne(id: string): Promise<SelectAmbulanceProviderDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(ambulanceProviders)
      .where(eq(ambulanceProviders.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`AmbulanceProvider with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: string,
    updateAmbulanceProviderDto: Partial<InsertAmbulanceProviderDto>
  ): Promise<SelectAmbulanceProviderDto> {
    const result = await this.db
      .getDb()
      .update(ambulanceProviders)
      .set(updateAmbulanceProviderDto)
      .where(eq(ambulanceProviders.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`AmbulanceProvider with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db
      .getDb()
      .delete(ambulanceProviders)
      .where(eq(ambulanceProviders.id, id));
  }
}
