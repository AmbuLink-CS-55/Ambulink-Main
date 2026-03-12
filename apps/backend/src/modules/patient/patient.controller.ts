import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { PatientService } from "./patient.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  patientBookingNoteBodySchema,
  patientBookingNoteQuerySchema,
  patientSessionUploadQuerySchema,
  patientUploadSessionStartSchema,
  createPatientSchema,
  updatePatientSchema,
  type PatientBookingNoteBodyDto,
  type PatientBookingNoteQueryDto,
  type PatientSessionUploadQueryDto,
  type PatientUploadSessionStartDto,
  type CreatePatientDto,
  type UpdatePatientDto,
} from "@/common/validation/schemas";
import {
  patientCancelHttpBodySchema,
  patientHelpHttpBodySchema,
} from "@/common/validation/socket.schemas";
import { PatientCommandService } from "./patient-command.service";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import type { UploadedMediaFile } from "../booking/booking-media.service";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@Controller("api/patients")
@UseGuards(AuthGuard)
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
    @Query("patientId") patientId: string | undefined,
    @Body(Validate(patientHelpHttpBodySchema))
    body: PatientPickupRequest
  ) {
    if (!patientId) {
      throw new BadRequestException("patientId is required");
    }
    await this.patientCommandService.requestHelp(patientId, {
      x: body.x,
      y: body.y,
      patientSettings: body.patientSettings as PatientPickupRequest["patientSettings"],
    });
    return { accepted: true };
  }
  //uncomment after testing
  // @Post("events/help")
  // async requestHelp(
  //   @CurrentUser() user: { id: string },
  //   @Body(Validate(patientHelpHttpBodySchema))
  //   body: PatientPickupRequest
  // ) {
  //   await this.patientCommandService.requestHelp(user.id, {
  //     x: body.x,
  //     y: body.y,
  //     patientSettings: body.patientSettings as PatientPickupRequest["patientSettings"],
  //   });
  //   return { accepted: true };
  // }

  @Post("events/cancel")
  async cancel(
    @Query("patientId") patientId: string | undefined,
    @Body(Validate(patientCancelHttpBodySchema))
    body: PatientCancelRequest
  ) {
    if (!patientId) {
      throw new BadRequestException("patientId is required");
    }
    await this.patientCommandService.cancel(patientId, { reason: body.reason });
    return { accepted: true };
  }
  //uncomment after testing
  // @Post("events/cancel")
  // async cancel(
  //   @CurrentUser() user: { id: string },
  //   @Body(Validate(patientCancelHttpBodySchema))
  //   body: PatientCancelRequest
  // ) {
  //   await this.patientCommandService.cancel(user.id, { reason: body.reason });
  //   return { accepted: true };
  // }

  @Post("events/upload-session/start")
  async startUploadSession(
    @Query(Validate(patientUploadSessionStartSchema)) query: PatientUploadSessionStartDto
  ) {
    return this.patientCommandService.startUploadSession(query.patientId);
  }
  //uncomment after testing
  // @Post("events/upload-session/start")
  // async startUploadSession(@CurrentUser() user: { id: string }) {
  //   return this.patientCommandService.startUploadSession(user.id);
  // }

  @Post("events/upload-session/:sessionId/files")
  @UseInterceptors(FilesInterceptor("files", 5))
  async uploadSessionFiles(
    @Param("sessionId") sessionId: string,
    @Query(Validate(patientSessionUploadQuerySchema)) query: PatientSessionUploadQueryDto,
    @UploadedFiles() files: UploadedMediaFile[],
    @Body() body: Record<string, unknown>
  ) {
    const content = typeof body.content === "string" ? body.content : undefined;
    const durationMs = typeof body.durationMs === "string" ? Number(body.durationMs) : undefined;

    return this.patientCommandService.uploadSessionFiles({
      patientId: query.patientId,
      sessionId,
      content,
      durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
      files: files ?? [],
    });
  }
  //uncomment after testing
  // @Post("events/upload-session/:sessionId/files")
  // @UseInterceptors(FilesInterceptor("files", 5))
  // async uploadSessionFiles(
  //   @CurrentUser() user: { id: string },
  //   @Param("sessionId") sessionId: string,
  //   @UploadedFiles() files: UploadedMediaFile[],
  //   @Body() body: Record<string, unknown>
  // ) {
  //   const content = typeof body.content === "string" ? body.content : undefined;
  //   const durationMs = typeof body.durationMs === "string" ? Number(body.durationMs) : undefined;

  //   return this.patientCommandService.uploadSessionFiles({
  //     patientId: user.id,
  //     sessionId,
  //     content,
  //     durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
  //     files: files ?? [],
  //   });
  // }

  @Post("events/booking/:bookingId/notes")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addBookingNote(
    @Param("bookingId") bookingId: string,
    @Query(Validate(patientBookingNoteQuerySchema)) query: PatientBookingNoteQueryDto,
    @UploadedFiles() files: UploadedMediaFile[],
    @Body() rawBody: Record<string, unknown>
  ) {
    const body = patientBookingNoteBodySchema.parse(rawBody) as PatientBookingNoteBodyDto;
    const note = await this.patientCommandService.addBookingNote({
      bookingId,
      patientId: query.patientId,
      content: body.content,
      durationMs: body.durationMs,
      files: files ?? [],
    });
    return { note };
  }
  //uncomment after testing
  // @Post("events/booking/:bookingId/notes")
  // @UseInterceptors(FilesInterceptor("files", 5))
  // async addBookingNote(
  //   @CurrentUser() user: { id: string },
  //   @Param("bookingId") bookingId: string,
  //   @UploadedFiles() files: UploadedMediaFile[],
  //   @Body() rawBody: Record<string, unknown>
  // ) {
  //   const body = patientBookingNoteBodySchema.parse(rawBody) as PatientBookingNoteBodyDto;
  //   const note = await this.patientCommandService.addBookingNote({
  //     bookingId,
  //     patientId: user.id,
  //     content: body.content,
  //     durationMs: body.durationMs,
  //     files: files ?? [],
  //   });
  //   return { note };
  // }
}
