import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  patientBookingNoteBodySchema,
  patientBookingNoteQuerySchema,
  patientSessionUploadQuerySchema,
  patientUploadSessionStartSchema,
  type PatientBookingNoteBodyDto,
  type PatientBookingNoteQueryDto,
  type PatientSessionUploadQueryDto,
  type PatientUploadSessionStartDto,
} from "@/common/validation/schemas";
import {
  patientCancelHttpBodySchema,
  patientHelpHttpBodySchema,
} from "@/common/validation/socket.schemas";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { PatientEventsService } from "./patient.events.service";

@Controller("api/patients/events")
export class PatientEventsController {
  constructor(private readonly patientEventsService: PatientEventsService) {}

  @Post("help")
  async requestHelp(
    @Query("patientId") patientId: string | undefined,
    @Body(Validate(patientHelpHttpBodySchema)) body: PatientPickupRequest
  ) {
    if (!patientId) {
      throw new BadRequestException("patientId is required");
    }
    await this.patientEventsService.requestHelp(patientId, {
      x: body.x,
      y: body.y,
      patientSettings: body.patientSettings as PatientPickupRequest["patientSettings"],
    });
    return { accepted: true };
  }

  @Post("cancel")
  async cancel(
    @Query("patientId") patientId: string | undefined,
    @Body(Validate(patientCancelHttpBodySchema)) body: PatientCancelRequest
  ) {
    if (!patientId) {
      throw new BadRequestException("patientId is required");
    }
    await this.patientEventsService.cancel(patientId, { reason: body.reason });
    return { accepted: true };
  }

  @Post("upload-session/start")
  async startUploadSession(
    @Query(Validate(patientUploadSessionStartSchema)) query: PatientUploadSessionStartDto
  ) {
    return this.patientEventsService.startUploadSession(query.patientId);
  }

  @Post("upload-session/:sessionId/files")
  @UseInterceptors(FilesInterceptor("files", 5))
  async uploadSessionFiles(
    @Param("sessionId") sessionId: string,
    @Query(Validate(patientSessionUploadQuerySchema)) query: PatientSessionUploadQueryDto,
    @UploadedFiles() files: UploadedMediaFile[],
    @Body() body: Record<string, unknown>
  ) {
    const content = typeof body.content === "string" ? body.content : undefined;
    const durationMs = typeof body.durationMs === "string" ? Number(body.durationMs) : undefined;

    return this.patientEventsService.uploadSessionFiles({
      patientId: query.patientId,
      sessionId,
      content,
      durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
      files: files ?? [],
    });
  }

  @Post("booking/:bookingId/notes")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addBookingNote(
    @Param("bookingId") bookingId: string,
    @Query(Validate(patientBookingNoteQuerySchema)) query: PatientBookingNoteQueryDto,
    @UploadedFiles() files: UploadedMediaFile[],
    @Body() rawBody: Record<string, unknown>
  ) {
    const body = patientBookingNoteBodySchema.parse(rawBody) as PatientBookingNoteBodyDto;
    const note = await this.patientEventsService.addBookingNote({
      bookingId,
      patientId: query.patientId,
      content: body.content,
      durationMs: body.durationMs,
      files: files ?? [],
    });
    return { note };
  }
}
