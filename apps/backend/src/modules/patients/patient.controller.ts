import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PatientService } from "./patient.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createPatientSchema,
  updatePatientSchema,
  type CreatePatientDto,
  type UpdatePatientDto,
} from "@/common/validation/schemas";
import {
  patientCancelHttpBodySchema,
  patientHelpHttpBodySchema,
} from "@/common/validation/socket.schemas";
import { PatientCommandService } from "./patient-command.service";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import { CurrentUser } from "@/common/auth/current-user.decorator";
import type { AuthUser } from "@/common/auth/auth.types";
import { Roles } from "@/common/auth/roles.decorator";

@Controller("api/patients")
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly patientCommandService: PatientCommandService
  ) {}

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

  @Post("events/help")
  @Roles("PATIENT")
  async requestHelp(
    @CurrentUser() user: AuthUser,
    @Body(Validate(patientHelpHttpBodySchema))
    body: PatientPickupRequest
  ) {
    await this.patientCommandService.requestHelp(user.sub, {
      x: body.x,
      y: body.y,
      patientSettings: body.patientSettings as PatientPickupRequest["patientSettings"],
    });
    return { accepted: true };
  }

  @Post("events/cancel")
  @Roles("PATIENT")
  async cancel(
    @CurrentUser() user: AuthUser,
    @Body(Validate(patientCancelHttpBodySchema))
    body: PatientCancelRequest
  ) {
    await this.patientCommandService.cancel(user.sub, { reason: body.reason });
    return { accepted: true };
  }
}
