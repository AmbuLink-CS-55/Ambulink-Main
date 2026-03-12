import { Inject, Injectable, forwardRef } from "@nestjs/common";
import type { Booking, Hospital, User } from "@/core/database/schema";
import type {
  BookingNote,
  EmtNote,
  PatientSettingsData,
} from "@ambulink/types";
import type { UploadedMediaFile } from "../booking-media.service";
import { BookingCoreService } from "../common/booking.core.service";

@Injectable()
export class BookingWsService {
  constructor(
    @Inject(forwardRef(() => BookingCoreService))
    private bookingCoreService: BookingCoreService
  ) {}

  createApprovedBooking(
    patient: { id: string },
    pickup: { x: number; y: number },
    hospital: Pick<Hospital, "id">,
    pickedDriver: Pick<User, "id" | "providerId">,
    dispatcherId: string,
    patientProfileSnapshot: PatientSettingsData | null
  ) {
    return this.bookingCoreService.createApprovedBooking(
      patient,
      pickup,
      hospital,
      pickedDriver,
      dispatcherId,
      patientProfileSnapshot
    );
  }

  getActiveBookingForPatient(patientId: string) {
    return this.bookingCoreService.getActiveBookingForPatient(patientId);
  }

  getActiveBookingForDriver(driverId: string) {
    return this.bookingCoreService.getActiveBookingForDriver(driverId);
  }

  cancelByPatient(patientId: string, reason: string) {
    return this.bookingCoreService.cancelByPatient(patientId, reason);
  }

  bindPatientDraftUploads(patientId: string, bookingId: string) {
    return this.bookingCoreService.bindPatientDraftUploads(patientId, bookingId);
  }

  buildAssignedBookingPayload(bookingId: string) {
    return this.bookingCoreService.buildAssignedBookingPayload(bookingId);
  }

  buildDispatcherBookingPayload(bookingId: string, requestId?: string) {
    return this.bookingCoreService.buildDispatcherBookingPayload(bookingId, requestId);
  }

  startPatientUploadSession(patientId: string) {
    return this.bookingCoreService.startPatientUploadSession(patientId);
  }

  appendPatientUploadSessionFiles(params: {
    patientId: string;
    sessionId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.bookingCoreService.appendPatientUploadSessionFiles(params);
  }

  addPatientBookingNote(params: {
    bookingId: string;
    patientId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.bookingCoreService.addPatientBookingNote(params);
  }

  updateBooking(bookingId: string, booking: Partial<Booking>) {
    return this.bookingCoreService.updateBooking(bookingId, booking);
  }

  getDispatcherActiveBookings(dispatcherId: string) {
    return this.bookingCoreService.getDispatcherActiveBookings(dispatcherId);
  }

  searchOngoingBookingsByProvider(providerId: string, query: string, limit?: number) {
    return this.bookingCoreService.searchOngoingBookingsByProvider(providerId, query, limit);
  }

  getActiveBookingById(bookingId: string) {
    return this.bookingCoreService.getActiveBookingById(bookingId);
  }

  getUserSubscribedBooking(userId: string) {
    return this.bookingCoreService.getUserSubscribedBooking(userId);
  }

  setUserSubscribedBooking(userId: string, bookingId: string) {
    return this.bookingCoreService.setUserSubscribedBooking(userId, bookingId);
  }

  getEmtSubscribersForBooking(bookingId: string) {
    return this.bookingCoreService.getEmtSubscribersForBooking(bookingId);
  }

  getOngoingBookingDispatchInfoForDriver(driverId: string) {
    return this.bookingCoreService.getOngoingBookingDispatchInfoForDriver(driverId);
  }

  appendBookingNote(bookingId: string, note: BookingNote) {
    return this.bookingCoreService.appendBookingNote(bookingId, note);
  }

  buildEmtMediaNote(params: {
    bookingId: string;
    emtId: string;
    emtName: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    return this.bookingCoreService.buildEmtMediaNote(params);
  }

  appendEmtNote(bookingId: string, note: EmtNote) {
    return this.bookingCoreService.appendEmtNote(bookingId, note);
  }
}
