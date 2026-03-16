import { BadRequestException, Body, Controller, Post, Query } from "@nestjs/common";
import {
  driverLocationHttpBodySchema,
  driverShiftHttpBodySchema,
} from "@/common/validation/socket.schemas";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import type { DriverLocationPayload } from "@ambulink/types";
import { DriverEventsService } from "./driver.events.service";

@Controller("api/drivers/events")
export class DriverEventsController {
  constructor(private readonly driverEventsService: DriverEventsService) {}

  @Post("location")
  async updateLocation(
    @Query("driverId") driverId: string | undefined,
    @Body(Validate(driverLocationHttpBodySchema)) body: DriverLocationPayload
  ) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverEventsService.updateLocation(driverId, { x: body.x, y: body.y });
    return { ok: true };
  }

  @Post("arrived")
  async arrived(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverEventsService.arrived(driverId);
    return { ok: true };
  }

  @Post("completed")
  async completed(@Query("driverId") driverId: string | undefined) {
    if (!driverId) {
      throw new BadRequestException("driverId is required");
    }
    await this.driverEventsService.completed(driverId);
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
    return this.driverEventsService.setShift(driverId, body.onShift);
  }
}
