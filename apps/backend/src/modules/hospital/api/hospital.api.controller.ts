import { Controller, Get, Query } from "@nestjs/common";
import { HospitalApiService } from "./hospital.api.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  hospitalNearbyQuerySchema,
  type HospitalNearbyQueryDto,
} from "@/common/validation/schemas";

@Controller("api/hospitals")
export class HospitalApiController {
  constructor(private readonly hospitalService: HospitalApiService) {}

  @Get("nearby")
  getNearby(@Query(Validate(hospitalNearbyQuerySchema)) query: HospitalNearbyQueryDto) {
    return this.hospitalService.findNearby(query.lat, query.lng, query.limit, query.radiusKm);
  }

  @Get()
  getAll() {
    return this.hospitalService.getAll();
  }
}
