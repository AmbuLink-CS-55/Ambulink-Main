import { BadRequestException, Injectable } from "@nestjs/common";
import { BookingCoreService } from "../common/booking.core.service";
import type { ReassignBookingDto } from "@/common/validation/schemas";

@Injectable()
export class BookingApiService {
  constructor(private bookingCoreService: BookingCoreService) {}

  getBookingLog(providerId?: string) {
    return this.bookingCoreService.getBookingLog(providerId);
  }

  getBookingDetailsForDispatcher(bookingId: string, dispatcherId: string) {
    return this.bookingCoreService.getBookingDetailsForDispatcher(bookingId, dispatcherId);
  }

  searchOngoingBookingsByProvider(providerId: string, query: string, limit?: number) {
    return this.bookingCoreService.searchOngoingBookingsByProvider(providerId, query, limit);
  }

  getAttachmentForActor(
    bookingId: string,
    attachmentId: string,
    actor: { patientId?: string; dispatcherId?: string; emtId?: string }
  ) {
    return this.bookingCoreService.getAttachmentForActor(bookingId, attachmentId, actor);
  }

  reassignBooking(bookingId: string, payload: ReassignBookingDto) {
    if (!payload.dispatcherId) {
      throw new BadRequestException("dispatcherId is required");
    }
    return this.bookingCoreService.reassignBooking(bookingId, payload.dispatcherId, payload);
  }
}
