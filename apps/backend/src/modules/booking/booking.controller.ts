import { Controller, Get, Query } from "@nestjs/common";
import { BookingService } from "./booking.service";

@Controller("api/booking")
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  findByProvider(@Query("providerId") providerId?: string, @Query("status") status?: string) {
    return this.bookingService.getBookingLog(providerId, status);
  }
}
