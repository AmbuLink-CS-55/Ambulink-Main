import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  emtAddNoteSchema,
  emtBookingSearchQuerySchema,
  emtSubscribeSchema,
  type EmtAddNoteDto,
  type EmtBookingSearchQueryDto,
  type EmtSubscribeDto,
} from "@/common/validation/schemas";
import {
  emtAddNoteHttpBodySchema,
  emtSubscribeHttpBodySchema,
} from "@/common/validation/socket.schemas";
import { EmtCommandService } from "./emt-command.service";
import { EmtService } from "./emt.service";

@Controller("api/emts")
export class EmtController {
  constructor(
    private readonly emtService: EmtService,
    private readonly emtCommandService: EmtCommandService
  ) {}

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
  async addNote(
    @Query("emtId") emtId: string | undefined,
    @Body(Validate(emtAddNoteHttpBodySchema)) body: EmtAddNoteDto
  ) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    const parsed = emtAddNoteSchema.parse(body);
    const note = await this.emtCommandService.addNote(emtId, parsed.bookingId, parsed.content);
    return { note };
  }
}
