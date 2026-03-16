import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
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
import { AttachmentAuthGuard } from "@/common/auth/attachment-auth.guard";

@Controller("api/booking")
export class BookingApiController {
  constructor(private readonly bookingService: BookingApiService) {}

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Get()
  findByProvider(@CurrentUser() user: AuthUser) {
    return this.bookingService.getBookingLog(user.providerId ?? undefined);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Get(":id/details")
  details(
    @Param("id") bookingId: string,
    @Query(Validate(bookingDetailsQuerySchema)) _query: BookingDetailsQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.bookingService.getBookingDetailsForDispatcher(bookingId, user.id);
  }

  @UseGuards(AttachmentAuthGuard)
  @Get(":id/attachments/:attachmentId")
  async attachment(
    @Param("id") bookingId: string,
    @Param("attachmentId") attachmentId: string,
    @Query(Validate(bookingAttachmentAccessQuerySchema))
    query: { patientId?: string; dispatcherId?: string; emtId?: string },
    @CurrentUser() user: AuthUser,
    @Res() res: Response
  ) {
    const requestedActorId = query.patientId ?? query.dispatcherId ?? query.emtId ?? null;
    if (requestedActorId && requestedActorId !== user.id) {
      throw new ForbiddenException("Actor mismatch");
    }

    const actor =
      user.role === "PATIENT"
        ? { patientId: user.id }
        : user.role === "DISPATCHER"
          ? { dispatcherId: user.id }
          : user.role === "EMT"
            ? { emtId: user.id }
            : null;

    if (!actor) {
      throw new BadRequestException("Unsupported actor role for attachment access");
    }

    const file = await this.bookingService.getAttachmentForActor(bookingId, attachmentId, actor);
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    res.sendFile(file.filePath);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
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
