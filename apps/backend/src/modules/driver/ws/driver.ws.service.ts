import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { UserStatus } from "@/core/database/schema";
import type { DriverLocationPayload } from "@ambulink/types";
import { EventBusService } from "@/core/events/event-bus.service";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { BookingWsService } from "@/modules/booking/ws/booking.ws.service";
import { BookingSharedRepository } from "@/modules/booking/common/booking.shared.repository";
import { DriverWsRepository } from "./driver.ws.repository";

@Injectable()
export class DriverWsService {
  private lastEmitTimes = new Map<string, number>();

  constructor(
    private dbService: DbService,
    private driverRepository: DriverWsRepository,
    private bookingRepository: BookingSharedRepository,
    @Inject(forwardRef(() => BookingWsService))
    private bookingService: BookingWsService,
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

  async getDriverForProviderOrThrow(
    driverId: string,
    providerId: string,
    db: DbExecutor = this.dbService.db
  ) {
    const [driver] = await this.driverRepository.findDriverById(driverId, db);
    if (!driver || !driver.isActive) {
      throw new NotFoundException({ code: "DRIVER_NOT_FOUND", message: "Driver not found" });
    }

    if (driver.providerId !== providerId) {
      throw new ForbiddenException({
        code: "DRIVER_PROVIDER_MISMATCH",
        message: "Driver provider does not match dispatcher provider",
      });
    }

    return driver;
  }

  async assertDriverNotBusy(driverId: string, db: DbExecutor = this.dbService.db) {
    const activeBookings = await this.bookingRepository.getDriverActiveBooking(driverId, db);
    if (activeBookings.length > 0) {
      throw new ConflictException({
        code: "BOOKING_DRIVER_BUSY",
        message: "Selected driver already has an active booking",
      });
    }
  }

  async markBusy(driverId: string, db: DbExecutor = this.dbService.db) {
    await this.driverRepository.setDriverStatus(driverId, "BUSY", db);
  }

  async markAvailableIfNoActiveBookings(
    driverId: string,
    db: DbExecutor = this.dbService.db
  ) {
    const activeBookings = await this.bookingRepository.getDriverActiveBooking(driverId, db);
    if (activeBookings.length === 0) {
      await this.driverRepository.setDriverStatus(driverId, "AVAILABLE", db);
    }
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

    const booking = await this.bookingService.getOngoingBookingDispatchInfoForDriver(driverId);
    if (booking?.patientId && booking.dispatcherId) {
      const locationUpdate = { id: driverId, x, y };
      this.eventBus.publish({
        type: "realtime.dispatcher",
        dispatcherId: booking.dispatcherId,
        event: "driver:update",
        payload: locationUpdate,
      });
      this.eventBus.publish({
        type: "realtime.patient",
        patientId: booking.patientId,
        event: "driver:update",
        payload: locationUpdate,
      });

      const emtSubscribers = await this.bookingService.getEmtSubscribersForBooking(booking.bookingId);
      for (const subscriber of emtSubscribers) {
        this.eventBus.publish({
          type: "realtime.emt",
          emtId: subscriber.emtId,
          event: "driver:update",
          payload: locationUpdate,
        });
      }
    }

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
