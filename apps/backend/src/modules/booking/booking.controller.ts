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
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@Controller("api/booking")
@UseGuards(AuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findByProvider(@Query(Validate(bookingListQuerySchema)) query: BookingListQueryDto) {
    return this.bookingService.getBookingLog(query.providerId, query.status);
  }
  //uncomment after testing
  // @Get()
  // findByProvider(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Query(Validate(bookingListQuerySchema)) query: BookingListQueryDto
  // ) {
  //   const providerId = query.providerId ?? user.providerId ?? undefined;
  //   return this.bookingService.getBookingLog(providerId, query.status);
  // }

  @Post("manual-assign")
  manualAssign(@Body(Validate(manualAssignBookingSchema)) body: ManualAssignBookingDto) {
    return this.bookingService.manualAssignBooking(body.dispatcherId, body);
  }
  //uncomment after testing
  // @Post("manual-assign")
  // manualAssign(
  //   @CurrentUser() user: { id: string; role?: string },
  //   @Body(Validate(manualAssignBookingSchema)) body: ManualAssignBookingDto
  // ) {
  //   return this.bookingService.manualAssignBooking(user.id, body);
  // }

  @Patch(":id/reassign")
  reassign(
    @Param("id") bookingId: string,
    @Body(Validate(reassignBookingSchema)) body: ReassignBookingDto
  ) {
    return this.bookingService.reassignBooking(bookingId, body.dispatcherId, body);
  }
  //uncomment after testing
  // @Patch(":id/reassign")
  // reassign(
  //   @CurrentUser() user: { id: string; role?: string },
  //   @Param("id") bookingId: string,
  //   @Body(Validate(reassignBookingSchema)) body: ReassignBookingDto
  // ) {
  //   return this.bookingService.reassignBooking(bookingId, user.id, body);
  // }

  @Get(":id/details")
  details(
    @Param("id") bookingId: string,
    @Query(Validate(bookingDetailsQuerySchema)) query: BookingDetailsQueryDto
  ) {
    return this.bookingService.getBookingDetailsForDispatcher(bookingId, query.dispatcherId);
  }
  //uncomment after testing
  // @Get(":id/details")
  // details(
  //   @CurrentUser() user: { id: string; role?: string },
  //   @Param("id") bookingId: string,
  //   @Query(Validate(bookingDetailsQuerySchema)) query: BookingDetailsQueryDto
  // ) {
  //   return this.bookingService.getBookingDetailsForDispatcher(bookingId, user.id);
  // }

  @Post(":id/notes")
  addNote(
    @Param("id") bookingId: string,
    @Body(Validate(bookingAddNoteSchema)) body: BookingAddNoteDto
  ) {
    return this.bookingService.addDispatcherNote(bookingId, body.dispatcherId, body.content);
  }
  //uncomment after testing
  // @Post(":id/notes")
  // addNote(
  //   @CurrentUser() user: { id: string; role?: string },
  //   @Param("id") bookingId: string,
  //   @Body(Validate(bookingAddNoteSchema)) body: BookingAddNoteDto
  // ) {
  //   return this.bookingService.addDispatcherNote(bookingId, user.id, body.content);
  // }

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
  //uncomment after testing
  // @Get(":id/attachments/:attachmentId")
  // async attachment(
  //   @CurrentUser() user: { id: string; role?: "PATIENT" | "DISPATCHER" | "EMT" | string },
  //   @Param("id") bookingId: string,
  //   @Param("attachmentId") attachmentId: string,
  //   @Query(Validate(bookingAttachmentAccessQuerySchema))
  //   query: { patientId?: string; dispatcherId?: string; emtId?: string },
  //   @Res() res: Response
  // ) {
  //   const actorQuery =
  //     user.role === "PATIENT"
  //       ? { patientId: user.id }
  //       : user.role === "DISPATCHER"
  //         ? { dispatcherId: user.id }
  //         : user.role === "EMT"
  //           ? { emtId: user.id }
  //           : query; // fallback only if needed

  //   const file = await this.bookingService.getAttachmentForActor(
  //     bookingId,
  //     attachmentId,
  //     actorQuery
  //   );
  //   res.setHeader("Content-Type", file.mimeType);
  //   res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
  //   res.sendFile(file.filePath);
  // }
}
