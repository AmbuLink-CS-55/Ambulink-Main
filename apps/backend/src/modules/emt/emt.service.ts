import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { BookingService } from "../booking/booking.service";
import { EmtRepository } from "./emt.repository";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { NotificationService } from "@/core/socket/notification.service";
import type { BookingAssignedPayload, BookingNote, UserStatus } from "@ambulink/types";

@Injectable()
export class EmtService {
  constructor(
    private emtRepository: EmtRepository,
    private bookingService: BookingService,
    private dispatcherService: DispatcherService,
    private notificationService: NotificationService
  ) {}

  async setStatus(emtId: string, status: UserStatus) {
    return this.emtRepository.setEmtStatus(emtId, status);
  }

  async findOne(emtId: string) {
    const [emt] = await this.emtRepository.findEmtById(emtId);
    if (!emt || !emt.isActive) {
      throw new NotFoundException("EMT not found");
    }
    return emt;
  }

  async searchOngoingBookings(emtId: string, query: string, limit?: number) {
    const emt = await this.findOne(emtId);
    if (!emt.providerId) {
      throw new BadRequestException("EMT is not attached to a provider");
    }

    const rows = await this.bookingService.searchOngoingBookingsByProvider(emt.providerId, query, limit);
    return rows.map((row) => ({
      bookingId: row.bookingId,
      shortId: row.bookingId.slice(0, 8),
      status: row.status,
    }));
  }

  async subscribeToBooking(emtId: string, bookingId: string): Promise<BookingAssignedPayload> {
    const emt = await this.findOne(emtId);
    if (!emt.providerId) {
      throw new BadRequestException("EMT is not attached to a provider");
    }

    const booking = await this.bookingService.getActiveBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException("Booking not found or not active");
    }

    if (!booking.providerId || booking.providerId !== emt.providerId) {
      throw new ForbiddenException("EMT cannot subscribe outside provider scope");
    }

    await this.bookingService.setUserSubscribedBooking(emtId, bookingId);

    const payload = await this.bookingService.buildAssignedBookingPayload(bookingId);
    if (!payload) {
      throw new NotFoundException("Booking payload unavailable");
    }

    this.notificationService.notifyEmt(emtId, "booking:assigned", payload);
    return payload;
  }

  async getCurrentBooking(emtId: string) {
    await this.findOne(emtId);
    const booking = await this.bookingService.getUserSubscribedBooking(emtId);
    if (!booking) {
      return null;
    }

    return this.bookingService.buildAssignedBookingPayload(booking.id);
  }

  async addNote(emtId: string, bookingId: string, content: string): Promise<BookingNote> {
    const emt = await this.findOne(emtId);
    if (!emt.providerId) {
      throw new BadRequestException("EMT is not attached to a provider");
    }

    if (emt.subscribedBookingId !== bookingId) {
      throw new ForbiddenException("EMT can only add notes to currently subscribed booking");
    }

    const booking = await this.bookingService.getActiveBookingById(bookingId);
    if (!booking) {
      throw new NotFoundException("Booking not found or not active");
    }

    if (!booking.providerId || booking.providerId !== emt.providerId) {
      throw new ForbiddenException("EMT cannot access booking outside provider scope");
    }

    const note: BookingNote = {
      id: randomUUID(),
      bookingId,
      authorId: emtId,
      authorName: emt.fullName ?? "EMT",
      authorRole: "EMT",
      content,
      createdAt: new Date().toISOString(),
    };

    await this.bookingService.appendBookingNote(bookingId, note);

    const emtSubscribers = await this.bookingService.getEmtSubscribersForBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.notificationService.notifyEmt(subscriber.emtId, "booking:notes", {
        bookingId,
        note,
      });
    }

    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(emt.providerId);
    for (const dispatcherId of dispatcherIds) {
      this.notificationService.notifyDispatcher(dispatcherId, "booking:notes", {
        bookingId,
        note,
      });
    }

    return note;
  }
}
