import { Injectable } from "@nestjs/common";
import type { NearbyHospital } from "@ambulink/types";
import { HospitalApiRepository } from "./hospital.api.repository";

@Injectable()
export class HospitalApiService {
  constructor(private hospitalRepository: HospitalApiRepository) {}

  async getAll() {
    return this.hospitalRepository.getAllHospitals();
  }

  async findNearby(
    lat: number,
    lng: number,
    limit: number,
    radiusKm: number
  ): Promise<NearbyHospital[]> {
    const rows = await this.hospitalRepository.getNearbyHospitals(lat, lng, limit, radiusKm);

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
