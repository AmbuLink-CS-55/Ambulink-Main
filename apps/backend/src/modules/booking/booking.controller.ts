import { Body, Controller, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { BookingService } from "./booking.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  bookingAttachmentAccessQuerySchema,
  bookingAddNoteSchema,
  bookingDetailsQuerySchema,
  bookingListQuerySchema,
  manualAssignBookingSchema,
  reassignBookingSchema,
  type BookingAddNoteDto,
  type BookingDetailsQueryDto,
  type BookingListQueryDto,
  type ManualAssignBookingDto,
  type ReassignBookingDto,
} from "@/common/validation/schemas";

@Controller("api/booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findByProvider(@Query(Validate(bookingListQuerySchema)) query: BookingListQueryDto) {
    return this.bookingService.getBookingLog(query.providerId, query.status);
  }

  @Post("manual-assign")
  manualAssign(@Body(Validate(manualAssignBookingSchema)) body: ManualAssignBookingDto) {
    return this.bookingService.manualAssignBooking(body.dispatcherId, body);
  }

  @Patch(":id/reassign")
  reassign(
    @Param("id") bookingId: string,
    @Body(Validate(reassignBookingSchema)) body: ReassignBookingDto
  ) {
    return this.bookingService.reassignBooking(bookingId, body.dispatcherId, body);
  }

  @Get(":id/details")
  details(
    @Param("id") bookingId: string,
    @Query(Validate(bookingDetailsQuerySchema)) query: BookingDetailsQueryDto
  ) {
    return this.bookingService.getBookingDetailsForDispatcher(bookingId, query.dispatcherId);
  }

  @Post(":id/notes")
  addNote(
    @Param("id") bookingId: string,
    @Body(Validate(bookingAddNoteSchema)) body: BookingAddNoteDto
  ) {
    return this.bookingService.addDispatcherNote(bookingId, body.dispatcherId, body.content);
  }

  @Get(":id/attachments/:attachmentId")
  async attachment(
    @Param("id") bookingId: string,
    @Param("attachmentId") attachmentId: string,
    @Query(Validate(bookingAttachmentAccessQuerySchema))
    query: { patientId?: string; dispatcherId?: string; emtId?: string },
    @Res() res: Response
  ) {
    const file = await this.bookingService.getAttachmentForActor(bookingId, attachmentId, query);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    res.sendFile(file.filePath);
  }
}
