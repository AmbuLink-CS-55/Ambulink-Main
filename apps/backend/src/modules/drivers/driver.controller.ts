import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { DriverService } from "./driver.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createDriverSchema,
  updateDriverSchema,
  type CreateDriverDto,
  type UpdateDriverDto,
} from "@/common/validation/schemas";
import type { UserStatus } from "@/common/database/schema";

@Controller("api/drivers")
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  create(
    @Body(Validate(createDriverSchema))
    body: CreateDriverDto
  ) {
    return this.driverService.create(body);
  }

  @Get()
  findAll(
    @Query("providerId") providerId?: string,
    @Query("isActive") isActive?: string,
    @Query("status") status?: string
  ) {
    const isActiveBool = isActive !== undefined ? isActive === "true" : undefined;
    return this.driverService.findAll(providerId, isActiveBool, status as UserStatus | undefined);
  }

  @Get("nearby")
  findNearby(
    @Query("lat") latQuery?: string,
    @Query("lng") lngQuery?: string,
    @Query("limit") limitQuery?: string
  ) {
    const lat = Number(latQuery ?? 0);
    const lng = Number(lngQuery ?? 0);
    const limit = Number(limitQuery ?? 6);
    return this.driverService.findNearby(lat, lng, limit);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.driverService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateDriverSchema))
    body: UpdateDriverDto
  ) {
    return this.driverService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.driverService.remove(id);
  }
}
