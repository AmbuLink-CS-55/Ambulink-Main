import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { AmbulanceProvider, ambulanceProviders, NewAmbulanceProvider } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";

@Injectable()
export class AmbulanceProviderService {
  constructor(private dbService: DbService) {}

  async create(
    createAmbulanceProviderDto: NewAmbulanceProvider
  ): Promise<NewAmbulanceProvider> {
    const result = await this.dbService.db
      .insert(ambulanceProviders)
      .values(createAmbulanceProviderDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<AmbulanceProvider[]> {
    return this.dbService.db.select().from(ambulanceProviders);
  }

  async findOne(id: string): Promise<AmbulanceProvider> {
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
    updateAmbulanceProviderDto: Partial<NewAmbulanceProvider>
  ): Promise<AmbulanceProvider> {
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
