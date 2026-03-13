import { Injectable } from "@nestjs/common";
import { BookingCoreService } from "../common/booking.core.service";

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
}
