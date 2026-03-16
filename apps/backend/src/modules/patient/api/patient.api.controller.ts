import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createPatientSchema,
  updatePatientSchema,
  type CreatePatientDto,
  type UpdatePatientDto,
} from "@/common/validation/schemas";
import { PatientApiService } from "./patient.api.service";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";

@UseGuards(AuthGuard, DispatcherRoleGuard)
@Controller("api/patients")
export class PatientApiController {
  constructor(private readonly patientService: PatientApiService) {}

  @Post()
  create(
    @Body(Validate(createPatientSchema))
    body: CreatePatientDto
  ) {
    return this.patientService.create(body);
  }

  @Get()
  findAll(@Query("isActive") isActive?: string) {
    const isActiveBool = isActive !== undefined ? isActive === "true" : undefined;
    return this.patientService.findAll(isActiveBool);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.patientService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updatePatientSchema))
    body: UpdatePatientDto
  ) {
    return this.patientService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.patientService.remove(id);
  }
}
