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
  patientCancelCommandSchema,
  patientHelpCommandSchema,
} from "@/common/validation/socket.schemas";
import { PatientCommandService } from "./patient-command.service";
import type { PatientCancelCommand, PatientHelpCommand, PatientPickupRequest } from "@ambulink/types";

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
  async requestHelp(
    @Body(Validate(patientHelpCommandSchema))
    body: PatientHelpCommand
  ) {
    await this.patientCommandService.requestHelp(body.patientId, {
      x: body.x,
      y: body.y,
      patientSettings: body.patientSettings as PatientPickupRequest["patientSettings"],
    });
    return { accepted: true };
  }

  @Post("events/cancel")
  async cancel(
    @Body(Validate(patientCancelCommandSchema))
    body: PatientCancelCommand
  ) {
    await this.patientCommandService.cancel(body.patientId, { reason: body.reason });
    return { accepted: true };
  }
}
