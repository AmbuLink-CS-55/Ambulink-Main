import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { BookingAssignedPayload, BookingNote, UserStatus } from "@ambulink/types";
import { BookingFlowService } from "@/modules/booking/flow/booking.flow.service";
import { DispatcherFlowService } from "@/modules/dispatcher/flow/dispatcher.flow.service";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { EventBusService } from "@/core/events/event-bus.service";
import { EmtFlowRepository } from "./emt.flow.repository";

@Injectable()
export class EmtFlowService {
  constructor(
    private emtRepository: EmtFlowRepository,
    private bookingService: BookingFlowService,
    private dispatcherService: DispatcherFlowService,
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
