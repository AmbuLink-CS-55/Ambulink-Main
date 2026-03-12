import { Controller, Get, Query } from "@nestjs/common";
import { HospitalService } from "./hospital.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  hospitalNearbyQuerySchema,
  type HospitalNearbyQueryDto,
} from "@/common/validation/schemas";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@Controller("api/hospitals")
@UseGuards(AuthGuard)
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get("nearby")
  getNearby(@Query(Validate(hospitalNearbyQuerySchema)) query: HospitalNearbyQueryDto) {
    return this.hospitalService.findNearby(query.lat, query.lng, query.limit, query.radiusKm);
  }

  @Get()
  getAll() {
    return this.hospitalService.getAll();
  }
}
