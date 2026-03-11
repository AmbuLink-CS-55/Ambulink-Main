import { BadRequestException, Body, Controller, Post, Query } from "@nestjs/common";
import {
  driverLocationHttpBodySchema,
  driverShiftHttpBodySchema,
} from "@/common/validation/socket.schemas";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import type { DriverLocationPayload } from "@ambulink/types";
import { DriverFlowService } from "./driver.flow.service";

@Controller("api/drivers/events")
export class DriverFlowController {
  constructor(private readonly driverFlowService: DriverFlowService) {}

  @Post("location")
  async updateLocation(
    @Query("driverId") driverId: string | undefined,
    @Body(Validate(driverLocationHttpBodySchema)) body: DriverLocationPayload
  ) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverFlowService.updateLocation(driverId, { x: body.x, y: body.y });
    return { ok: true };
  }

  @Post("arrived")
  async arrived(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverFlowService.arrived(driverId);
    return { ok: true };
  }

  @Post("completed")
  async completed(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverFlowService.completed(driverId);
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
    return this.driverFlowService.setShift(driverId, body.onShift);
  }
}
