import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { DriverService } from "./driver.service";
import {
  insertDriverSchema,
  type InsertDriverDto,
} from "../../db/schemas/driver.schema";
import { Validate } from "../../common/pipes/zod-validation.pipe";

@Controller("api/drivers")
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  create(
    @Body(Validate(insertDriverSchema))
    body: InsertDriverDto
  ) {
    return this.driverService.create(body);
  }

  @Get()
  findAll() {
    return this.driverService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.driverService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(insertDriverSchema.partial()))
    body: Partial<InsertDriverDto>
  ) {
    return this.driverService.update(+id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.driverService.remove(+id);
  }
}
