import { eq, sql } from "drizzle-orm";
import { hospitals } from "@/common/database/schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/common/database/schema";

type Db = PostgresJsDatabase<typeof schema>;

export const getAllHospitals = (db: Db) => db.select().from(hospitals);

export const getHospitalById = async (db: Db, id: string) => {
  return db.select().from(hospitals).where(eq(hospitals.id, id));
};

export const getNearestHospital = (db: Db, lat: number, lng: number) =>
  db
    .select()
    .from(hospitals)
    .orderBy(sql`${hospitals.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`)
    .limit(1);

export const getNearbyHospitals = (
  db: Db,
  lat: number,
  lng: number,
  limit: number,
  radiusKm: number
) => {
  const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
  const radiusMeters = radiusKm * 1000;
  const distanceExpr = sql<number>`ST_DistanceSphere(${hospitals.location}, ${point})`;

  return db
    .select({
      id: hospitals.id,
      name: hospitals.name,
      hospitalType: hospitals.hospitalType,
      address: hospitals.address,
      phoneNumber: hospitals.phoneNumber,
      isActive: hospitals.isActive,
      locationX: sql<number | null>`ST_X(${hospitals.location})`,
      locationY: sql<number | null>`ST_Y(${hospitals.location})`,
      distanceMeters: distanceExpr,
    })
    .from(hospitals)
    .where(
      sql`${hospitals.isActive} = true
        AND ${hospitals.location} IS NOT NULL
        AND ST_DWithin(${hospitals.location}::geography, ${point}::geography, ${radiusMeters})`
    )
    .orderBy(distanceExpr)
    .limit(limit);
};
