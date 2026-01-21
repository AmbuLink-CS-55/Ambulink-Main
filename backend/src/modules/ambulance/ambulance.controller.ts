import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  insertAmbulanceSchema,
  type InsertAmbulanceDto,
} from "@/database/dto/ambulance.schema";
import { AmbulanceService } from "./ambulance.service";

@Controller("api/ambulances")
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  @Post()
  create(
    @Body(Validate(insertAmbulanceSchema))
    body: InsertAmbulanceDto
  ) {
    return this.ambulanceService.create(body);
  }

  @Get()
  findAll() {
    return this.ambulanceService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ambulanceService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(insertAmbulanceSchema.partial()))
    body: Partial<InsertAmbulanceDto>
  ) {
    return this.ambulanceService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceService.remove(id);
  }
}
