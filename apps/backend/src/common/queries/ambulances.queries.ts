import { eq } from "drizzle-orm";
import { ambulance } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";
import type { NewAmbulance } from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const createAmbulance = (db: Db, ambulanceData: NewAmbulance) =>
  db.insert(ambulance).values(ambulanceData).returning();

export const getAllAmbulances = (db: Db, providerId?: string) => {
  if (!providerId) {
    return db.select().from(ambulance);
  }
  return db.select().from(ambulance).where(eq(ambulance.providerId, providerId));
};

export const getAmbulanceById = (db: Db, id: string) =>
  db.select().from(ambulance).where(eq(ambulance.id, id));

export const updateAmbulance = (db: Db, id: string, ambulanceData: Partial<NewAmbulance>) =>
  db.update(ambulance).set(ambulanceData).where(eq(ambulance.id, id)).returning();

export const deleteAmbulance = (db: Db, id: string) =>
  db.delete(ambulance).where(eq(ambulance.id, id));
