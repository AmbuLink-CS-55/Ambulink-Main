import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { DriverService } from "./driver.service";
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
import {
  driverLocationHttpBodySchema,
  driverShiftHttpBodySchema,
} from "@/common/validation/socket.schemas";
import { DriverCommandService } from "./driver-command.service";
import type { DriverLocationPayload } from "@ambulink/types";
import { CurrentUser } from "@/core/auth/current-user.decorator";
import type { AuthUser } from "@/core/auth/auth.types";
import { Roles } from "@/core/auth/roles.decorator";

@Controller("api/drivers")
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    private readonly driverCommandService: DriverCommandService
  ) {}

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

  @Post("events/location")
  @Roles("DRIVER")
  async updateLocation(
    @CurrentUser() user: AuthUser,
    @Body(Validate(driverLocationHttpBodySchema)) body: DriverLocationPayload
  ) {
    await this.driverCommandService.updateLocation(user.sub, { x: body.x, y: body.y });
    return { ok: true };
  }

  @Post("events/arrived")
  @Roles("DRIVER")
  async arrived(@CurrentUser() user: AuthUser) {
    await this.driverCommandService.arrived(user.sub);
    return { ok: true };
  }

  @Post("events/completed")
  @Roles("DRIVER")
  async completed(@CurrentUser() user: AuthUser) {
    await this.driverCommandService.completed(user.sub);
    return { ok: true };
  }

  @Post("events/shift")
  @Roles("DRIVER")
  async setShift(
    @CurrentUser() user: AuthUser,
    @Body(Validate(driverShiftHttpBodySchema)) body: { onShift: boolean }
  ) {
    return this.driverCommandService.setShift(user.sub, body.onShift);
  }
}
