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
import { PatientService } from "./patient.service";
import { insertPatientSchema } from "@/common/dto/patient.schema";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import type { InsertPatientDto } from "@/common/dto/patient.schema";

@Controller("api/patients")
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(
    @Body(Validate(insertPatientSchema))
    body: InsertPatientDto
  ) {
    return this.patientService.create(body);
  }

  @Get()
  findAll(@Query("isActive") isActive?: string) {
    const isActiveBool =
      isActive !== undefined ? isActive === "true" : undefined;
    return this.patientService.findAll(isActiveBool);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.patientService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(insertPatientSchema.partial()))
    body: Partial<InsertPatientDto>
  ) {
    return this.patientService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.patientService.remove(id);
  }
}
