import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { DriverService } from "./driver.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import type { NewUser, User } from "@/common/database/schema";

@Controller("api/drivers")
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  create(
    // @Body(Validate(insertDriverSchema))
    body: NewUser
  ) {
    return this.driverService.create(body);
  }

  @Get()
  findAll(
    @Query("providerId") providerId?: string,
    @Query("isActive") isActive?: string
  ) {
    const isActiveBool =
      isActive !== undefined ? isActive === "true" : undefined;
    return this.driverService.findAll(providerId, isActiveBool);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.driverService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    // @Body(Validate(insertDriverSchema.partial()))
    body: NewUser
  ) {
    return this.driverService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.driverService.remove(id);
  }
}
