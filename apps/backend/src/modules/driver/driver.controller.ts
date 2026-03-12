import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
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
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@Controller("api/drivers")
@UseGuards(AuthGuard)
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
  // uncomment after testing
  // @Get(":id")
  // findOne(@CurrentUser() user: { id: string }, @Param("id") id: string) {
  //   return this.driverService.findOne(id);
  // }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateDriverSchema))
    body: UpdateDriverDto
  ) {
    return this.driverService.update(id, body);
  }
  // uncomment after testing
  // @Patch(":id")
  // update(
  //   @CurrentUser() user: { id: string },
  //   @Param("id") id: string,
  //   @Body(Validate(updateDriverSchema)) body: UpdateDriverDto
  // ) {
  //   return this.driverService.update(id, body);
  // }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.driverService.remove(id);
  }
  // uncomment after testing
  // @Delete(":id")
  // remove(@CurrentUser() user: { id: string }, @Param("id") id: string) {
  //   return this.driverService.remove(id);
  // }
  @Post("events/location")
  async updateLocation(
    @Query("driverId") driverId: string | undefined,
    @Body(Validate(driverLocationHttpBodySchema)) body: DriverLocationPayload
  ) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverCommandService.updateLocation(driverId, { x: body.x, y: body.y });
    return { ok: true };
  }

  // uncomment after testing
  // @Post("events/location")
  // async updateLocation(
  //   @CurrentUser() user: { id: string },
  //   @Body(Validate(driverLocationHttpBodySchema)) body: DriverLocationPayload
  // ) {
  //   await this.driverCommandService.updateLocation(user.id, { x: body.x, y: body.y });
  //   return { ok: true };
  // }

  @Post("events/arrived")
  async arrived(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverCommandService.arrived(driverId);
    return { ok: true };
  }

  // uncomment after testing
  // @Post("events/arrived")
  // async arrived(@CurrentUser() user: { id: string }) {
  //   await this.driverCommandService.arrived(user.id);
  //   return { ok: true };
  // }

  @Post("events/completed")
  async completed(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverCommandService.completed(driverId);
    return { ok: true };
  }
  // uncomment after testing
  // @Post("events/completed")
  // async completed(@CurrentUser() user: { id: string }) {
  //   await this.driverCommandService.completed(user.id);
  //   return { ok: true };
  // }
  @Post("events/shift")
  async setShift(
    @Query("driverId") driverId: string | undefined,
    @Body(Validate(driverShiftHttpBodySchema)) body: { onShift: boolean }
  ) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    return this.driverCommandService.setShift(driverId, body.onShift);
  }
  // uncomment after testing
  // @Post("events/shift")
  // async setShift(
  //   @CurrentUser() user: { id: string },
  //   @Body(Validate(driverShiftHttpBodySchema)) body: { onShift: boolean }
  // ) {
  //   return this.driverCommandService.setShift(user.id, body.onShift);
  // }
}
