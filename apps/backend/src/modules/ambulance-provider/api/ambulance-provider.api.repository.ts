import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { ambulanceProviders } from "@/core/database/schema";
import { DbService } from "@/core/database/db.service";
import type { NewAmbulanceProvider } from "@/core/database/schema";

@Injectable()
export class AmbulanceProviderApiRepository {
  constructor(private dbService: DbService) {}

  createAmbulanceProvider(provider: NewAmbulanceProvider) {
    return this.dbService.db.insert(ambulanceProviders).values(provider).returning();
  }

  getAllAmbulanceProviders() {
    return this.dbService.db.select().from(ambulanceProviders);
  }

  getAmbulanceProviderById(id: string) {
    return this.dbService.db.select().from(ambulanceProviders).where(eq(ambulanceProviders.id, id));
  }

  updateAmbulanceProvider(id: string, provider: Partial<NewAmbulanceProvider>) {
    return this.dbService.db
      .update(ambulanceProviders)
      .set(provider)
      .where(eq(ambulanceProviders.id, id))
      .returning();
  }

  deleteAmbulanceProvider(id: string) {
    return this.dbService.db.delete(ambulanceProviders).where(eq(ambulanceProviders.id, id));
  }
}
