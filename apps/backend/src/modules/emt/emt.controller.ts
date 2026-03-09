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
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createEmtSchema,
  emtListQuerySchema,
  emtAddNoteSchema,
  emtAddNoteMediaBodySchema,
  emtBookingSearchQuerySchema,
  emtSubscribeSchema,
  updateEmtSchema,
  type CreateEmtDto,
  type EmtAddNoteDto,
  type EmtAddNoteMediaBodyDto,
  type EmtBookingSearchQueryDto,
  type EmtListQueryDto,
  type EmtSubscribeDto,
  type UpdateEmtDto,
} from "@/common/validation/schemas";
import { emtSubscribeHttpBodySchema } from "@/common/validation/socket.schemas";
import { EmtCommandService } from "./emt-command.service";
import { EmtService } from "./emt.service";
import type { UploadedMediaFile } from "../booking/booking-media.service";

@Controller("api/emts")
export class EmtController {
  constructor(
    private readonly emtService: EmtService,
    private readonly emtCommandService: EmtCommandService
  ) {}

  @Post()
  create(
    @Body(Validate(createEmtSchema))
    body: CreateEmtDto
  ) {
    return this.emtService.create(body);
  }

  @Get()
  findAll(@Query(Validate(emtListQuerySchema)) query: EmtListQueryDto) {
    return this.emtService.findAll(query.providerId, query.isActive, query.status);
  }

  @Get("bookings/search")
  searchBookings(
    @Query("emtId") emtId: string | undefined,
    @Query(Validate(emtBookingSearchQuerySchema)) query: EmtBookingSearchQueryDto
  ) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    return this.emtService.searchOngoingBookings(emtId, query.q, query.limit);
  }

  @Get("events/current")
  async current(@Query("emtId") emtId: string | undefined) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    const booking = await this.emtService.getCurrentBooking(emtId);
    return { booking };
  }

  @Post("events/subscribe")
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

  @Post("events/notes")
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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.emtService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateEmtSchema))
    body: UpdateEmtDto
  ) {
    return this.emtService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.emtService.remove(id);
  }
}
