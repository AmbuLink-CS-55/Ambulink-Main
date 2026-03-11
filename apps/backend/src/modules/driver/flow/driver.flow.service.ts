import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@/core/database/schema";
import type { DriverLocationPayload } from "@ambulink/types";
import { EventBusService } from "@/core/events/event-bus.service";
import { BookingFlowService } from "@/modules/booking/flow/booking.flow.service";
import { DriverFlowRepository } from "./driver.flow.repository";

@Injectable()
export class DriverFlowService {
  private lastEmitTimes = new Map<string, number>();

  constructor(
    private driverRepository: DriverFlowRepository,
    private bookingService: BookingFlowService,
    private eventBus: EventBusService
  ) {}

  async setStatus(driverId: string, status: UserStatus) {
    const result = await this.driverRepository.setDriverStatus(driverId, status);
    const updated = result[0];
    if (!updated) {
      throw new NotFoundException(`Driver with id ${driverId} not found`);
    }

    this.eventBus.publish({
      type: "realtime.dispatchers",
      event: "driver:roster",
      payload: {
        providerId: updated.providerId,
        driver: updated,
        action: "updated",
      },
    });
    return updated;
  }

  async isAvailable(driverId: string) {
    const result = await this.driverRepository.checkDriverAvailability(driverId);

    if (result.length === 0) return false;
    return result[0].status === "AVAILABLE";
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    if (lat === undefined || lng === undefined) return;

    const result = await this.driverRepository.setDriverLocation(driverId, lat, lng);
    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${driverId} not found`);
    }
  }

  async clearDriverLocation(driverId: string) {
    const result = await this.driverRepository.clearDriverLocation(driverId);
    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${driverId} not found`);
    }
  }

  async findDriverByLocation(lat: number, lng: number) {
    return this.driverRepository.findDriversByLocation(lat, lng);
  }

  async getDriverBooking(driverId: string) {
    const data = await this.driverRepository.getDriverBooking(driverId);
    return data[0];
  }

  async setShift(driverId: string, onShift: boolean) {
    if (!onShift) {
      const activeBooking = await this.bookingService.getActiveBookingForDriver(driverId);
      if (activeBooking) {
        throw new BadRequestException("Cannot clock out while handling an active booking");
      }
      await this.clearDriverLocation(driverId);
    }

    await this.setStatus(driverId, onShift ? "AVAILABLE" : "OFFLINE");

    return {
      ok: true,
      driverId,
      onShift,
      status: onShift ? "AVAILABLE" : "OFFLINE",
    };
  }

  async updateLocation(driverId: string, data: DriverLocationPayload) {
    const { x, y } = data;
    await this.setDriverLocation(driverId, y, x);

    await this.bookingService.sendDriverLocation(driverId, { id: driverId, x, y });

    const now = Date.now();
    const lastEmit = this.lastEmitTimes.get(driverId) || 0;
    if (now - lastEmit > 1000) {
      this.eventBus.publish({
        type: "realtime.dispatchers",
        event: "driver:update",
        payload: {
          id: driverId,
          x,
          y,
        },
      });
      this.lastEmitTimes.set(driverId, now);
    }
  }

  async arrived(driverId: string) {
    const bookingData = await this.getDriverBooking(driverId);
    if (!bookingData) {
      throw new NotFoundException("No active booking found");
    }

    await this.bookingService.updateBooking(bookingData.id, { status: "ARRIVED" });
  }

  async completed(driverId: string) {
    const bookingData = await this.getDriverBooking(driverId);
    if (!bookingData) {
      throw new NotFoundException("No active booking found");
    }

    await this.bookingService.updateBooking(bookingData.id, { status: "COMPLETED" });
    await this.setStatus(driverId, "AVAILABLE");
  }
}
