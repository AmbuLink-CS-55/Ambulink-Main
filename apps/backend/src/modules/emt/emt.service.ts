import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { BookingService } from "../booking/booking.service";
import { EmtRepository } from "./emt.repository";
import { DispatcherService } from "../dispatcher/dispatcher.service";
import { NotificationService } from "@/core/socket/notification.service";
import type { CreateEmtDto, UpdateEmtDto } from "@/common/validation/schemas";
import type { BookingAssignedPayload, BookingNote, UserStatus } from "@ambulink/types";
import type { UploadedMediaFile } from "../booking/booking-media.service";

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

  async create(createEmtDto: CreateEmtDto) {
    const result = await this.emtRepository.createEmt(createEmtDto);
    const created = result[0];
    if (created) {
      this.notificationService.notifyAllDispatchers("emt:roster", {
        providerId: created.providerId,
        emt: created,
        action: "created",
      });
    }
    return created;
  }

  async findAll(providerId?: string, isActive?: boolean, status?: UserStatus) {
    return this.emtRepository.findAllEmts(providerId, isActive, status);
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

    const rows = await this.bookingService.searchOngoingBookingsByProvider(
      emt.providerId,
      query,
      limit
    );
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
      this.notificationService.notifyEmt(subscriber.emtId, "booking:notes", {
        bookingId,
        note,
      });
    }

    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(
      emt.providerId
    );
    for (const dispatcherId of dispatcherIds) {
      this.notificationService.notifyDispatcher(dispatcherId, "booking:notes", {
        bookingId,
        note,
      });
    }

    if (booking.patientId) {
      this.notificationService.notifyPatient(booking.patientId, "booking:notes", {
        bookingId,
        note,
      });
    }

    return note;
  }

  async update(id: string, updateEmtDto: UpdateEmtDto) {
    await this.findOne(id);

    const result = await this.emtRepository.updateEmt(id, updateEmtDto);
    const updated = result[0];
    if (!updated) {
      throw new NotFoundException(`EMT with id ${id} not found`);
    }

    this.notificationService.notifyAllDispatchers("emt:roster", {
      providerId: updated.providerId,
      emt: updated,
      action: "updated",
    });
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.emtRepository.removeEmt(id);
    this.notificationService.notifyAllDispatchers("emt:roster", {
      providerId: null,
      emt: { id },
      action: "removed",
    });
  }
}
