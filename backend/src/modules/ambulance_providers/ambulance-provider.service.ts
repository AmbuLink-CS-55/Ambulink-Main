import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { ambulanceProviders } from "@/common/database/schema";
import type {
  InsertAmbulanceProviderDto,
  SelectAmbulanceProviderDto,
} from "@/common/dto/ambulance-provider.schema";
import { DbService } from "@/common/database/db.service";

@Injectable()
export class AmbulanceProviderService {
  constructor(private dbService: DbService) {}

  async create(
    createAmbulanceProviderDto: InsertAmbulanceProviderDto
  ): Promise<SelectAmbulanceProviderDto> {
    const result = await this.dbService.db
      .insert(ambulanceProviders)
      .values(createAmbulanceProviderDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<SelectAmbulanceProviderDto[]> {
    return this.dbService.db.select().from(ambulanceProviders);
  }

  async findOne(id: string): Promise<SelectAmbulanceProviderDto> {
    const result = await this.dbService.db
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
    const result = await this.dbService.db
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
    await this.dbService.db
      .delete(ambulanceProviders)
      .where(eq(ambulanceProviders.id, id));
  }
}
