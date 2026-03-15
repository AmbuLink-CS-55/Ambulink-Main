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
import type {
  BookingEtaUpdatedPayload,
  BookingStatus,
  DriverLocationPayload,
  Point,
} from "@ambulink/types";
import { EventBusService } from "@/core/events/event-bus.service";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { BookingEventsService } from "@/modules/booking/events/booking.events.service";
import { BookingSharedRepository } from "@/modules/booking/common/booking.shared.repository";
import { DispatcherEventsService } from "@/modules/dispatcher/events/dispatcher.events.service";
import { DriverEventsRepository } from "./driver.events.repository";

@Injectable()
export class DriverEventsService {
  private lastEmitTimes = new Map<string, number>();
  private etaEmitByBooking = new Map<string, number>();
  private etaValueByBooking = new Map<string, number>();
  private static readonly ETA_EMIT_INTERVAL_MS = 30_000;
  private static readonly ETA_CHANGE_THRESHOLD_MINUTES = 2;
  private static readonly AVG_DRIVER_SPEED_KMH = 35;

  constructor(
    private dbService: DbService,
    private driverRepository: DriverEventsRepository,
    private bookingRepository: BookingSharedRepository,
    @Inject(forwardRef(() => BookingEventsService))
    private bookingService: BookingEventsService,
    private dispatcherService: DispatcherEventsService,
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
    return result[0];
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
    const updated = await this.setDriverLocation(driverId, y, x);

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

      await this.emitEtaUpdateIfRequired(
        {
          bookingId: booking.bookingId,
          patientId: booking.patientId,
          dispatcherId: booking.dispatcherId,
        },
        {
          x,
          y,
        }
      );
    }

    const now = Date.now();
    const lastEmit = this.lastEmitTimes.get(driverId) || 0;
    if (now - lastEmit > 1000) {
      const providerId = updated?.providerId;
      if (providerId) {
        this.eventBus.publish({
          type: "realtime.dispatchers",
          event: "driver:update",
          payload: {
            providerId,
            id: driverId,
            x,
            y,
          },
        });
        this.lastEmitTimes.set(driverId, now);
      }
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

  private async emitEtaUpdateIfRequired(
    bookingInfo: { bookingId: string; patientId: string | null; dispatcherId: string | null },
    driverPoint: Point
  ) {
    const assigned = await this.bookingService.buildAssignedBookingPayload(bookingInfo.bookingId);
    if (!assigned) return;

    const destination = this.pickEtaDestination(assigned.status, assigned);
    if (!destination) return;

    const etaMinutes = this.estimateEtaMinutes(driverPoint, destination);
    const previousEtaMinutes = this.etaValueByBooking.get(bookingInfo.bookingId) ?? null;
    const now = Date.now();
    const lastEmit = this.etaEmitByBooking.get(bookingInfo.bookingId) ?? 0;
    const isFirstEta = previousEtaMinutes === null;
    const isSignificantDelta =
      previousEtaMinutes !== null &&
      Math.abs(previousEtaMinutes - etaMinutes) >= DriverEventsService.ETA_CHANGE_THRESHOLD_MINUTES;

    this.etaValueByBooking.set(bookingInfo.bookingId, etaMinutes);

    if (!isFirstEta && !isSignificantDelta) {
      return;
    }
    if (now - lastEmit < DriverEventsService.ETA_EMIT_INTERVAL_MS) {
      return;
    }

    const changedAt = new Date(now).toISOString();
    const payload = {
      bookingId: bookingInfo.bookingId,
      etaMinutes,
      previousEtaMinutes,
      changedAt,
    } satisfies BookingEtaUpdatedPayload;

    this.eventBus.publish({
      type: "realtime.driver",
      driverId: assigned.driver.id,
      event: "booking:eta-updated",
      payload,
    });

    if (bookingInfo.patientId) {
      this.eventBus.publish({
        type: "realtime.patient",
        patientId: bookingInfo.patientId,
        event: "booking:eta-updated",
        payload,
      });
    }

    const emtSubscribers = await this.bookingService.getEmtSubscribersForBooking(bookingInfo.bookingId);
    for (const subscriber of emtSubscribers) {
      this.eventBus.publish({
        type: "realtime.emt",
        emtId: subscriber.emtId,
        event: "booking:eta-updated",
        payload,
      });
    }

    if (assigned.provider?.id) {
      const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(
        assigned.provider.id
      );
      for (const dispatcherId of dispatcherIds) {
        this.eventBus.publish({
          type: "realtime.dispatcher",
          dispatcherId,
          event: "booking:eta-updated",
          payload: {
            ...payload,
            providerId: assigned.provider.id,
          },
        });
      }
    } else if (bookingInfo.dispatcherId) {
      this.eventBus.publish({
        type: "realtime.dispatcher",
        dispatcherId: bookingInfo.dispatcherId,
        event: "booking:eta-updated",
        payload,
      });
    }

    this.etaEmitByBooking.set(bookingInfo.bookingId, now);
  }

  private pickEtaDestination(
    status: BookingStatus,
    payload: Awaited<ReturnType<BookingEventsService["buildAssignedBookingPayload"]>>
  ): Point | null {
    if (!payload) return null;
    if (status === "ASSIGNED") {
      return payload.pickupLocation ?? payload.patient.location ?? null;
    }
    if (status === "ARRIVED" || status === "PICKEDUP") {
      return payload.hospital.location ?? null;
    }
    return null;
  }

  private estimateEtaMinutes(origin: Point, destination: Point): number {
    const distanceKm = this.haversineDistanceKm(origin, destination);
    const hours = distanceKm / DriverEventsService.AVG_DRIVER_SPEED_KMH;
    return Math.max(1, Math.round(hours * 60));
  }

  private haversineDistanceKm(a: Point, b: Point): number {
    const toRad = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(b.y - a.y);
    const dLon = toRad(b.x - a.x);
    const lat1 = toRad(a.y);
    const lat2 = toRad(b.y);

    const sinLat = Math.sin(dLat / 2);
    const sinLon = Math.sin(dLon / 2);

    const h =
      sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
    return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
  }
}
