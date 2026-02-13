import { sql } from "drizzle-orm";
import { hospitals } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const getAllHospitals = (db: Db) => db.select().from(hospitals);

export const getHospitalById = (db: Db, id: string) =>
  db.select().from(hospitals).where(sql`${hospitals.id} = ${id}`);

export const getNearestHospital = (db: Db, lat: number, lng: number) =>
  db
    .select()
    .from(hospitals)
    .orderBy(sql`${hospitals.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`)
    .limit(1);

export type GetAllHospitalsResult = Awaited<ReturnType<typeof getAllHospitals>>;
export type GetHospitalByIdResult = Awaited<ReturnType<typeof getHospitalById>>;
export type GetNearestHospitalResult = Awaited<ReturnType<typeof getNearestHospital>>;
