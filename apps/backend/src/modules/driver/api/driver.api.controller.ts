import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { DispatcherAdminGuard } from "@/common/auth/dispatcher-admin.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";

@Controller("api/drivers")
export class DriverApiController {
  constructor(private readonly driverService: DriverApiService) {}

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @UseGuards(DispatcherAdminGuard)
  @Post()
  create(
    @Body(Validate(createDriverSchema))
    body: CreateDriverDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.driverService.create({
      ...body,
      providerId: user.providerId ?? undefined,
    });
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Get()
  findAll(
    @Query(Validate(driverListQuerySchema)) query: DriverListQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.driverService.findAll(user.providerId ?? undefined, query.isActive, query.status);
  }

  @Get("nearby")
  findNearby(@Query(Validate(driverNearbyQuerySchema)) query: DriverNearbyQueryDto) {
    return this.driverService.findNearby(query.lat, query.lng, query.limit);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.driverService.findOne(id, user.providerId ?? undefined);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @UseGuards(DispatcherAdminGuard)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateDriverSchema))
    body: UpdateDriverDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.driverService.update(id, {
      ...body,
      providerId: undefined,
    }, user.providerId ?? undefined);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @UseGuards(DispatcherAdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.driverService.remove(id, user.providerId ?? undefined);
  }
}
