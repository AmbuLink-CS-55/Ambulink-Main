import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ServiceService } from "./service.service";
import {
  insertServiceSchema,
  type InsertServiceDto,
} from "../../db/dto/service.schema";
import { Validate } from "../../common/pipes/zod-validation.pipe";

@Controller("api/services")
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) { }

  @Post()
  create(
    @Body(Validate(insertServiceSchema))
    body: InsertServiceDto
  ) {
    return this.serviceService.create(body);
  }

  @Get()
  findAll() {
    return this.serviceService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.serviceService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(insertServiceSchema.partial()))
    body: Partial<InsertServiceDto>
  ) {
    return this.serviceService.update(+id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.serviceService.remove(+id);
  }
}
