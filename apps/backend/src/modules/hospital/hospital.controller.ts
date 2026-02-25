import { Controller, Get, Query } from "@nestjs/common";
import { HospitalService } from "./hospital.service";

@Controller("api/hospitals")
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get("nearby")
  getNearby(
    @Query("lat") latQuery?: string,
    @Query("lng") lngQuery?: string,
    @Query("limit") limitQuery?: string,
    @Query("radiusKm") radiusKmQuery?: string
  ) {
    const lat = Number(latQuery ?? 0);
    const lng = Number(lngQuery ?? 0);
    const limit = Number(limitQuery ?? 5);
    const radiusKm = Number(radiusKmQuery ?? 10);

    return this.hospitalService.findNearby(lat, lng, limit, radiusKm);
  }

  @Get()
  getAll() {
    return this.hospitalService.getAll();
  }
}
