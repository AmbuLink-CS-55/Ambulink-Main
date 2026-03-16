import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { BookingAssignedPayload, BookingNote, UserStatus } from "@ambulink/types";
import { BookingEventsService } from "@/modules/booking/events/booking.events.service";
import { DispatcherEventsService } from "@/modules/dispatcher/events/dispatcher.events.service";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { EventBusService } from "@/core/events/event-bus.service";
import { EmtEventsRepository } from "./emt.events.repository";

@Injectable()
export class EmtEventsService {
  constructor(
    private emtRepository: EmtEventsRepository,
    @Inject(forwardRef(() => BookingEventsService))
    private bookingService: BookingEventsService,
    private dispatcherService: DispatcherEventsService,
    private eventBus: EventBusService
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

  async getEmtOrThrow(emtId: string) {
    const [emt] = await this.emtRepository.findEmtById(emtId);
    if (!emt) {
      throw new NotFoundException({ code: "EMT_NOT_FOUND", message: "EMT not found" });
    }
    return emt;
  }

  assertBookingAttachmentScope(emt: { subscribedBookingId: string | null; providerId: string | null }, bookingId: string, providerId: string | null) {
    if (emt.subscribedBookingId !== bookingId) {
      throw new ForbiddenException({
        code: "BOOKING_EMT_SCOPE",
        message: "EMT can only access subscribed booking attachments",
      });
    }
    if (!providerId || providerId !== emt.providerId) {
      throw new ForbiddenException({
        code: "BOOKING_OUTSIDE_PROVIDER_SCOPE",
        message: "EMT cannot access outside provider scope",
      });
    }
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

    this.eventBus.publish({
      type: "realtime.emt",
      emtId,
      event: "booking:assigned",
      payload,
    });
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

  async addNote(
    emtId: string,
    bookingId: string,
    content: string,
    files: UploadedMediaFile[] = [],
    durationMs?: number
  ): Promise<BookingNote> {
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

    const hasContent = Boolean(content.trim().length > 0);
    if (!hasContent && files.length === 0) {
      throw new BadRequestException("Note text or at least one file is required");
    }
    const note: BookingNote =
      files.length > 0
        ? await this.bookingService.buildEmtMediaNote({
            bookingId,
            emtId,
            emtName: emt.fullName ?? "EMT",
            content,
            files,
            durationMs: durationMs ?? null,
          })
        : {
            id: randomUUID(),
            bookingId,
            authorId: emtId,
            authorName: emt.fullName ?? "EMT",
            authorRole: "EMT",
            content,
            type: "TEXT",
            attachments: [],
            createdAt: new Date().toISOString(),
          };

    await this.bookingService.appendBookingNote(bookingId, note);

    const emtSubscribers = await this.bookingService.getEmtSubscribersForBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.eventBus.publish({
        type: "realtime.emt",
        emtId: subscriber.emtId,
        event: "booking:notes",
        payload: {
          bookingId,
          note,
        },
      });
    }

    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(
      emt.providerId
    );
    for (const dispatcherId of dispatcherIds) {
      this.eventBus.publish({
        type: "realtime.dispatcher",
        dispatcherId,
        event: "booking:notes",
        payload: {
          bookingId,
          note,
        },
      });
    }

    if (booking.patientId) {
      this.eventBus.publish({
        type: "realtime.patient",
        patientId: booking.patientId,
        event: "booking:notes",
        payload: {
          bookingId,
          note,
        },
      });
    }

    return note;
  }
}
