import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createDriverSchema,
  driverListQuerySchema,
  driverNearbyQuerySchema,
  updateDriverSchema,
  type CreateDriverDto,
  type DriverListQueryDto,
  type DriverNearbyQueryDto,
  type UpdateDriverDto,
} from "@/common/validation/schemas";
import { DriverApiService } from "./driver.api.service";

@Controller("api/drivers")
export class DriverApiController {
  constructor(private readonly driverService: DriverApiService) {}

  @Post()
  create(
    @Body(Validate(createDriverSchema))
    body: CreateDriverDto
  ) {
    return this.driverService.create(body);
  }

  @Get()
  findAll(@Query(Validate(driverListQuerySchema)) query: DriverListQueryDto) {
    return this.driverService.findAll(query.providerId, query.isActive, query.status);
  }

  @Get("nearby")
  findNearby(@Query(Validate(driverNearbyQuerySchema)) query: DriverNearbyQueryDto) {
    return this.driverService.findNearby(query.lat, query.lng, query.limit);
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
