import { Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { hospitals } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";

@Injectable()
export class HospitalApiRepository {
  constructor(private dbService: DbService) {}

  getAllHospitals() {
    return this.dbService.db.select().from(hospitals);
  }

  getHospitalById(id: string, db: DbExecutor = this.dbService.db) {
    return db.select().from(hospitals).where(eq(hospitals.id, id));
  }

  getNearestHospital(lat: number, lng: number) {
    return this.dbService.db
      .select()
      .from(hospitals)
      .orderBy(sql`${hospitals.location} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`)
      .limit(1);
  }

  getNearbyHospitals(lat: number, lng: number, limit: number, radiusKm: number) {
    const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
    const radiusMeters = radiusKm * 1000;
    const distanceExpr = sql<number>`ST_DistanceSphere(${hospitals.location}, ${point})`;

    return this.dbService.db
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
  }
}
