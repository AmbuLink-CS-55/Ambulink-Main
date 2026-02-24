import { DbService } from "@/common/database/db.service";
import { Injectable } from "@nestjs/common";
import { getAllHospitals, getNearbyHospitals, getNearestHospital } from "@/common/queries";

@Injectable()
export class HospitalService {
  constructor(private dbService: DbService) {}

  async getAll() {
    return getAllHospitals(this.dbService.db);
  }

  async findTheNearestHospital(lat: number, lng: number) {
    const nearestHospital = await getNearestHospital(this.dbService.db, lat, lng);
    return nearestHospital[0];
  }

  async findNearby(lat: number, lng: number, limit: number, radiusKm: number) {
    const rows = await getNearbyHospitals(this.dbService.db, lat, lng, limit, radiusKm);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      hospitalType: row.hospitalType,
      address: row.address,
      phoneNumber: row.phoneNumber,
      isActive: row.isActive,
      location:
        row.locationX !== null && row.locationY !== null
          ? { x: row.locationX, y: row.locationY }
          : null,
      distanceMeters: Number(row.distanceMeters),
      distanceKm: Number((Number(row.distanceMeters) / 1000).toFixed(2)),
    }));
  }
}
