import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateEmtDto, UpdateEmtDto } from "@/common/validation/schemas";
import type { UserStatus } from "@ambulink/types";
import { BookingApiService } from "@/modules/booking/api/booking.api.service";
import { EventBusService } from "@/core/events/event-bus.service";
import { EmtApiRepository } from "./emt.api.repository";

@Injectable()
export class EmtApiService {
  constructor(
    private emtRepository: EmtApiRepository,
    private bookingService: BookingApiService,
    private eventBus: EventBusService
  ) {}

  async create(createEmtDto: CreateEmtDto) {
    const result = await this.emtRepository.createEmt(createEmtDto);
    const created = result[0];
    if (created) {
      this.eventBus.publish({
        type: "realtime.dispatchers",
        event: "emt:roster",
        payload: {
          providerId: created.providerId,
          emt: created,
          action: "created",
        },
      });
    }
    return created;
  }

  async findAll(providerId?: string, isActive?: boolean, status?: UserStatus) {
    return this.emtRepository.findAllEmts(providerId, isActive, status);
  }

  async findOne(emtId: string, providerId?: string) {
    const [emt] = await this.emtRepository.findEmtById(emtId);
    if (!emt || !emt.isActive) {
      throw new NotFoundException("EMT not found");
    }
    if (providerId && emt.providerId !== providerId) {
      throw new ForbiddenException("EMT is outside dispatcher provider scope");
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

  async update(id: string, updateEmtDto: UpdateEmtDto, providerId?: string) {
    await this.findOne(id, providerId);

    const result = await this.emtRepository.updateEmt(id, updateEmtDto);
    const updated = result[0];
    if (!updated) {
      throw new NotFoundException(`EMT with id ${id} not found`);
    }

    this.eventBus.publish({
      type: "realtime.dispatchers",
      event: "emt:roster",
      payload: {
        providerId: updated.providerId,
        emt: updated,
        action: "updated",
      },
    });
    return updated;
  }

  async remove(id: string, providerId?: string) {
    await this.findOne(id, providerId);
    await this.emtRepository.removeEmt(id);
    this.eventBus.publish({
      type: "realtime.dispatchers",
      event: "emt:roster",
      payload: {
        providerId: null,
        emt: { id },
        action: "removed",
      },
    });
  }
}
