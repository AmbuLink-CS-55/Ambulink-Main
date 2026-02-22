import { eq } from "drizzle-orm";
import { ambulanceProviders } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";
import type { NewAmbulanceProvider } from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const createAmbulanceProvider = (db: Db, provider: NewAmbulanceProvider) =>
  db.insert(ambulanceProviders).values(provider).returning();

export const getAllAmbulanceProviders = (db: Db) => db.select().from(ambulanceProviders);

export const getAmbulanceProviderById = (db: Db, id: string) =>
  db.select().from(ambulanceProviders).where(eq(ambulanceProviders.id, id));

export const updateAmbulanceProvider = (
  db: Db,
  id: string,
  provider: Partial<NewAmbulanceProvider>
) => db.update(ambulanceProviders).set(provider).where(eq(ambulanceProviders.id, id)).returning();

export const deleteAmbulanceProvider = (db: Db, id: string) =>
  db.delete(ambulanceProviders).where(eq(ambulanceProviders.id, id));

export type CreateAmbulanceProviderResult = Awaited<ReturnType<typeof createAmbulanceProvider>>;
export type GetAllAmbulanceProvidersResult = Awaited<ReturnType<typeof getAllAmbulanceProviders>>;
export type GetAmbulanceProviderByIdResult = Awaited<ReturnType<typeof getAmbulanceProviderById>>;
export type UpdateAmbulanceProviderResult = Awaited<ReturnType<typeof updateAmbulanceProvider>>;
export type DeleteAmbulanceProviderResult = Awaited<ReturnType<typeof deleteAmbulanceProvider>>;
