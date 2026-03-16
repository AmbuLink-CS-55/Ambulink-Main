import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  patientBookingNoteBodySchema,
  type PatientBookingNoteBodyDto,
} from "@/common/validation/schemas";
import {
  patientCancelHttpBodySchema,
  patientHelpHttpBodySchema,
} from "@/common/validation/socket.schemas";
import type { PatientCancelRequest, PatientPickupRequest } from "@ambulink/types";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { PatientEventsService } from "./patient.events.service";
import { AuthGuard } from "@/common/auth/auth.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";

@Controller("api/patients/events")
export class PatientEventsController {
  private readonly logger = new Logger(PatientEventsController.name);

  constructor(private readonly patientEventsService: PatientEventsService) {}

  @Post("guest-bookings/start")
  async startGuestBooking(
    @Body(Validate(patientHelpHttpBodySchema)) body: PatientPickupRequest
  ) {
    return this.patientEventsService.startGuestBookingAndRequestHelp({
      x: body.x,
      y: body.y,
      patientSettings: body.patientSettings as PatientPickupRequest["patientSettings"],
    });
  }

  @UseGuards(AuthGuard)
  @Post("help")
  async requestHelp(
    @CurrentUser() user: AuthUser,
    @Body(Validate(patientHelpHttpBodySchema)) body: PatientPickupRequest
  ) {
    if (user.role !== "PATIENT") {
      throw new BadRequestException("PATIENT role is required");
    }
    this.logger.log(`requestHelp received`, {
      patientId: user.id,
      hasSettings: Boolean(body.patientSettings),
      x: body.x,
      y: body.y,
    });
    await this.patientEventsService.requestHelp(user.id, {
      x: body.x,
      y: body.y,
      patientSettings: body.patientSettings as PatientPickupRequest["patientSettings"],
    });
    this.logger.log(`requestHelp completed`, { patientId: user.id });
    return { accepted: true };
  }

  @UseGuards(AuthGuard)
  @Post("cancel")
  async cancel(
    @CurrentUser() user: AuthUser,
    @Body(Validate(patientCancelHttpBodySchema)) body: PatientCancelRequest
  ) {
    if (user.role !== "PATIENT") {
      throw new BadRequestException("PATIENT role is required");
    }
    await this.patientEventsService.cancel(user.id, { reason: body.reason });
    return { accepted: true };
  }

  @UseGuards(AuthGuard)
  @Post("upload-session/start")
  async startUploadSession(@CurrentUser() user: AuthUser) {
    if (user.role !== "PATIENT") {
      throw new BadRequestException("PATIENT role is required");
    }
    return this.patientEventsService.startUploadSession(user.id);
  }

  @UseGuards(AuthGuard)
  @Post("upload-session/:sessionId/files")
  @UseInterceptors(FilesInterceptor("files", 5))
  async uploadSessionFiles(
    @Param("sessionId") sessionId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: UploadedMediaFile[],
    @Body() body: Record<string, unknown>
  ) {
    if (user.role !== "PATIENT") {
      throw new BadRequestException("PATIENT role is required");
    }
    const content = typeof body.content === "string" ? body.content : undefined;
    const durationMs = typeof body.durationMs === "string" ? Number(body.durationMs) : undefined;

    return this.patientEventsService.uploadSessionFiles({
      patientId: user.id,
      sessionId,
      content,
      durationMs: Number.isFinite(durationMs) ? durationMs : undefined,
      files: files ?? [],
    });
  }

  @UseGuards(AuthGuard)
  @Post("booking/:bookingId/notes")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addBookingNote(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: UploadedMediaFile[],
    @Body() rawBody: Record<string, unknown>
  ) {
    if (user.role !== "PATIENT") {
      throw new BadRequestException("PATIENT role is required");
    }
    const body = patientBookingNoteBodySchema.parse(rawBody) as PatientBookingNoteBodyDto;
    const note = await this.patientEventsService.addBookingNote({
      bookingId,
      patientId: user.id,
      content: body.content,
      durationMs: body.durationMs,
      files: files ?? [],
    });
    return { note };
  }
}
