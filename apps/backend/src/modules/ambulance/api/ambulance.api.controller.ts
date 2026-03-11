import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AmbulanceApiService } from "./ambulance.api.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createAmbulanceSchema,
  updateAmbulanceSchema,
  type CreateAmbulanceDto,
  type UpdateAmbulanceDto,
} from "@/common/validation/schemas";

@Controller("api/ambulances")
export class AmbulanceApiController {
  constructor(private readonly ambulanceService: AmbulanceApiService) {}

  @Post()
  create(
    @Body(Validate(createAmbulanceSchema))
    body: CreateAmbulanceDto
  ) {
    return this.ambulanceService.create(body);
  }

  @Get()
  findAll(@Query("providerId") providerId?: string) {
    return this.ambulanceService.findAll(providerId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ambulanceService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateAmbulanceSchema))
    body: UpdateAmbulanceDto
  ) {
    return this.ambulanceService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceService.remove(id);
  }
}
