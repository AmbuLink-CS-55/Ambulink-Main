import { Injectable } from "@nestjs/common";
import type {
  BookingAnalyticsQueryDto,
  ManualAssignBookingDto,
  ReassignBookingDto,
} from "@/common/validation/schemas";
import { BookingCoreService } from "../common/booking.core.service";

@Injectable()
export class BookingApiService {
  constructor(private bookingCoreService: BookingCoreService) {}

  getBookingLog(providerId?: string, status?: string) {
    return this.bookingCoreService.getBookingLog(providerId, status);
  }

  manualAssignBooking(dispatcherId: string, payload: ManualAssignBookingDto) {
    return this.bookingCoreService.manualAssignBooking(dispatcherId, payload);
  }

  reassignBooking(bookingId: string, dispatcherId: string, payload: ReassignBookingDto) {
    return this.bookingCoreService.reassignBooking(bookingId, dispatcherId, payload);
  }

  getBookingDetailsForDispatcher(bookingId: string, dispatcherId: string) {
    return this.bookingCoreService.getBookingDetailsForDispatcher(bookingId, dispatcherId);
  }

  getBookingResponseAnalytics(query: BookingAnalyticsQueryDto) {
    return this.bookingCoreService.getBookingResponseAnalytics(
      query.dispatcherId,
      query.from,
      query.to
    );
  }

  getBookingZonesAnalytics(query: BookingAnalyticsQueryDto) {
    return this.bookingCoreService.getBookingZonesAnalytics(
      query.dispatcherId,
      query.from,
      query.to
    );
  }

  getBookingInsightsAnalytics(query: BookingAnalyticsQueryDto) {
    return this.bookingCoreService.getBookingInsightsAnalytics(
      query.dispatcherId,
      query.from,
      query.to
    );
  }

  addDispatcherNote(bookingId: string, dispatcherId: string, content: string) {
    return this.bookingCoreService.addDispatcherNote(bookingId, dispatcherId, content);
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
