import { Body, Controller, Get, Param, Patch, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  bookingAttachmentAccessQuerySchema,
  bookingDetailsQuerySchema,
  reassignBookingSchema,
  type BookingDetailsQueryDto,
  type ReassignBookingDto,
} from "@/common/validation/schemas";
import { BookingApiService } from "./booking.api.service";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";

@UseGuards(AuthGuard, DispatcherRoleGuard)
@Controller("api/booking")
export class BookingApiController {
  constructor(private readonly bookingService: BookingApiService) {}

  @Get()
  findByProvider(@CurrentUser() user: AuthUser) {
    return this.bookingService.getBookingLog(user.providerId ?? undefined);
  }

  @Get(":id/details")
  details(
    @Param("id") bookingId: string,
    @Query(Validate(bookingDetailsQuerySchema)) _query: BookingDetailsQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.bookingService.getBookingDetailsForDispatcher(bookingId, user.id);
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

  @Patch(":id/reassign")
  reassign(
    @Param("id") bookingId: string,
    @Body(Validate(reassignBookingSchema)) payload: ReassignBookingDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.bookingService.reassignBooking(bookingId, {
      ...payload,
      dispatcherId: user.id,
    });
  }
}
