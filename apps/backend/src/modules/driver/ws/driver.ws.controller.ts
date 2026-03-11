import { BadRequestException, Body, Controller, Post, Query } from "@nestjs/common";
import {
  driverLocationHttpBodySchema,
  driverShiftHttpBodySchema,
} from "@/common/validation/socket.schemas";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import type { DriverLocationPayload } from "@ambulink/types";
import { DriverWsService } from "./driver.ws.service";

@Controller("api/drivers/events")
export class DriverWsController {
  constructor(private readonly driverWsService: DriverWsService) {}

  @Post("location")
  async updateLocation(
    @Query("driverId") driverId: string | undefined,
    @Body(Validate(driverLocationHttpBodySchema)) body: DriverLocationPayload
  ) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverWsService.updateLocation(driverId, { x: body.x, y: body.y });
    return { ok: true };
  }

  @Post("arrived")
  async arrived(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverWsService.arrived(driverId);
    return { ok: true };
  }

  @Post("completed")
  async completed(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverWsService.completed(driverId);
    return { ok: true };
  }

  @Post("shift")
  async setShift(
    @Query("driverId") driverId: string | undefined,
    @Body(Validate(driverShiftHttpBodySchema)) body: { onShift: boolean }
  ) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    return this.driverWsService.setShift(driverId, body.onShift);
  }
}
