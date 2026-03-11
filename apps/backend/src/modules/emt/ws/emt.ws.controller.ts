import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  emtAddNoteMediaBodySchema,
  emtAddNoteSchema,
  emtSubscribeSchema,
  type EmtAddNoteDto,
  type EmtAddNoteMediaBodyDto,
  type EmtSubscribeDto,
} from "@/common/validation/schemas";
import { emtSubscribeHttpBodySchema } from "@/common/validation/socket.schemas";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import { EmtWsCommandService } from "./emt.ws-command.service";
import { EmtWsService } from "./emt.ws.service";

@Controller("api/emts/events")
export class EmtWsController {
  constructor(
    private readonly emtWsService: EmtWsService,
    private readonly emtCommandService: EmtWsCommandService
  ) {}

  @Get("current")
  async current(@Query("emtId") emtId: string | undefined) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    const booking = await this.emtWsService.getCurrentBooking(emtId);
    return { booking };
  }

  @Post("subscribe")
  async subscribe(
    @Query("emtId") emtId: string | undefined,
    @Body(Validate(emtSubscribeHttpBodySchema)) body: EmtSubscribeDto
  ) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    const parsed = emtSubscribeSchema.parse(body);
    const booking = await this.emtCommandService.subscribe(emtId, parsed.bookingId);
    return { booking };
  }

  @Post("notes")
  @UseInterceptors(FilesInterceptor("files", 5))
  async addNote(
    @Query("emtId") emtId: string | undefined,
    @Body() rawBody: Record<string, unknown>,
    @UploadedFiles() files: UploadedMediaFile[]
  ) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    const isMultipart = Array.isArray(files) && files.length > 0;
    const parsed = isMultipart
      ? (emtAddNoteMediaBodySchema.parse(rawBody) as EmtAddNoteMediaBodyDto)
      : (emtAddNoteSchema.parse(rawBody as EmtAddNoteDto) as EmtAddNoteDto);

    const note = await this.emtCommandService.addNote({
      emtId,
      bookingId: parsed.bookingId,
      content: parsed.content,
      files: files ?? [],
      durationMs: "durationMs" in parsed ? parsed.durationMs : undefined,
    });
    return { note };
  }
}
