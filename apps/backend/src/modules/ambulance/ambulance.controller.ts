import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AmbulanceService } from "./ambulance.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createAmbulanceSchema,
  updateAmbulanceSchema,
  type CreateAmbulanceDto,
  type UpdateAmbulanceDto,
} from "@/common/validation/schemas";

@Controller("api/ambulances")
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  @Post()
  create(
    @Body(Validate(createAmbulanceSchema))
    body: CreateAmbulanceDto
  ) {
    return this.ambulanceService.create(body);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ambulanceService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateAmbulanceSchema))
    body: UpdateAmbulanceDto
  ) {
    return this.ambulanceService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceService.remove(id);
  }
}
