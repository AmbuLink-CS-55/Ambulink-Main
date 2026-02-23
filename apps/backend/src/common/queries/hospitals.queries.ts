import { eq, sql } from "drizzle-orm";
import { hospitals } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const getAllHospitals = (db: Db) => db.select().from(hospitals);

export const getHospitalById = async (db: Db, id: string) => {
  const hospital = await db.select().from(hospitals).where(eq(hospitals.id, id));
  console.log(hospital);
  return hospital;
};

export const getNearestHospital = (db: Db, lat: number, lng: number) =>
  db
    .select()
    .from(hospitals)
    .orderBy(sql`${hospitals.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`)
    .limit(1);
