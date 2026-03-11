import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { ambulance } from "@/core/database/schema";
import { DbService } from "@/core/database/db.service";
import type { NewAmbulance } from "@/core/database/schema";

@Injectable()
export class AmbulanceFlowRepository {
  constructor(private dbService: DbService) {}

  createAmbulance(ambulanceData: NewAmbulance) {
    return this.dbService.db.insert(ambulance).values(ambulanceData).returning();
  }

  getAllAmbulances(providerId?: string) {
    if (!providerId) {
      return this.dbService.db.select().from(ambulance);
    }
    return this.dbService.db.select().from(ambulance).where(eq(ambulance.providerId, providerId));
  }

  getAmbulanceById(id: string) {
    return this.dbService.db.select().from(ambulance).where(eq(ambulance.id, id));
  }

  updateAmbulance(id: string, ambulanceData: Partial<NewAmbulance>) {
    return this.dbService.db
      .update(ambulance)
      .set(ambulanceData)
      .where(eq(ambulance.id, id))
      .returning();
  }

  deleteAmbulance(id: string) {
    return this.dbService.db.delete(ambulance).where(eq(ambulance.id, id));
  }
}
