import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { BookingService } from "./booking.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  manualAssignBookingSchema,
  reassignBookingSchema,
  type ManualAssignBookingDto,
  type ReassignBookingDto,
} from "@/common/validation/schemas";

@Controller("api/booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findByProvider(@Query("providerId") providerId?: string, @Query("status") status?: string) {
    return this.bookingService.getBookingLog(providerId, status);
  }

  @Post("manual-assign")
  manualAssign(@Body(Validate(manualAssignBookingSchema)) body: ManualAssignBookingDto) {
    return this.bookingService.manualAssignBooking(body);
  }

  @Patch(":id/reassign")
  reassign(
    @Param("id") bookingId: string,
    @Body(Validate(reassignBookingSchema)) body: ReassignBookingDto
  ) {
    return this.bookingService.reassignBooking(bookingId, body);
  }
}
