import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  bookingListQuerySchema,
  manualAssignBookingSchema,
  reassignBookingSchema,
  type BookingListQueryDto,
  type ManualAssignBookingDto,
  type ReassignBookingDto,
} from "@/common/validation/schemas";
import { CurrentUser } from "@/core/auth/current-user.decorator";
import type { AuthUser } from "@/core/auth/auth.types";
import { Roles } from "@/core/auth/roles.decorator";

@Controller("api/booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @Roles("DISPATCHER")
  findByProvider(@Query(Validate(bookingListQuerySchema)) query: BookingListQueryDto) {
    return this.bookingService.getBookingLog(query.providerId, query.status);
  }

  @Post("manual-assign")
  @Roles("DISPATCHER")
  manualAssign(
    @CurrentUser() user: AuthUser,
    @Body(Validate(manualAssignBookingSchema)) body: ManualAssignBookingDto
  ) {
    return this.bookingService.manualAssignBooking(user.sub, body);
  }

  @Patch(":id/reassign")
  @Roles("DISPATCHER")
  reassign(
    @CurrentUser() user: AuthUser,
    @Param("id") bookingId: string,
    @Body(Validate(reassignBookingSchema)) body: ReassignBookingDto
  ) {
    return this.bookingService.reassignBooking(bookingId, user.sub, body);
  }
}
