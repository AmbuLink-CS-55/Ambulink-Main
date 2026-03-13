import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  bookingAttachmentAccessQuerySchema,
  bookingDetailsQuerySchema,
  bookingListQuerySchema,
  type BookingDetailsQueryDto,
  type BookingListQueryDto,
} from "@/common/validation/schemas";
import { BookingApiService } from "./booking.api.service";

@Controller("api/booking")
export class BookingApiController {
  constructor(private readonly bookingService: BookingApiService) {}

  @Get()
  findByProvider(@Query(Validate(bookingListQuerySchema)) query: BookingListQueryDto) {
    return this.bookingService.getBookingLog(query.providerId);
  }

  @Get(":id/details")
  details(
    @Param("id") bookingId: string,
    @Query(Validate(bookingDetailsQuerySchema)) query: BookingDetailsQueryDto
  ) {
    return this.bookingService.getBookingDetailsForDispatcher(bookingId, query.dispatcherId);
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
