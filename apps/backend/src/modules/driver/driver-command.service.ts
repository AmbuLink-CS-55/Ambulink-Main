import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { DriverLocationPayload } from "@ambulink/types";
import { BookingService } from "../booking/booking.service";
import { DriverService } from "./driver.service";
import { NotificationService } from "@/core/socket/notification.service";

@Injectable()
export class DriverCommandService {
  private lastEmitTimes = new Map<string, number>();

  constructor(
    private driverService: DriverService,
    private bookingService: BookingService,
    private notificationService: NotificationService
  ) {}

  async setShift(driverId: string, onShift: boolean) {
    if (!onShift) {
      const activeBooking = await this.bookingService.getActiveBookingForDriver(driverId);
      if (activeBooking) {
        throw new BadRequestException("Cannot clock out while handling an active booking");
      }
      await this.driverService.clearDriverLocation(driverId);
    }

    await this.driverService.setStatus(driverId, onShift ? "AVAILABLE" : "OFFLINE");

    return {
      ok: true,
      driverId,
      onShift,
      status: onShift ? "AVAILABLE" : "OFFLINE",
    };
  }

  async updateLocation(driverId: string, data: DriverLocationPayload) {
    const { x, y } = data;
    await this.driverService.setDriverLocation(driverId, y, x);

    await this.bookingService.sendDriverLocation(driverId, { id: driverId, x, y });

    const now = Date.now();
    const lastEmit = this.lastEmitTimes.get(driverId) || 0;
    if (now - lastEmit > 1000) {
      this.notificationService.notifyAllDispatchers("driver:update", {
        id: driverId,
        x,
        y,
      });
      this.lastEmitTimes.set(driverId, now);
    }
  }

  async arrived(driverId: string) {
    const bookingData = await this.driverService.getDriverBooking(driverId);
    if (!bookingData) {
      throw new NotFoundException("No active booking found");
    }

    await this.bookingService.updateBooking(bookingData.id, { status: "ARRIVED" });
    const { id, patientId } = bookingData;
    this.notificationService.notifyPatient(patientId!, "booking:arrived", {
      bookingId: id,
    });
  }

  async completed(driverId: string) {
    const bookingData = await this.driverService.getDriverBooking(driverId);
    if (!bookingData) {
      throw new NotFoundException("No active booking found");
    }

    await this.bookingService.updateBooking(bookingData.id, { status: "COMPLETED" });
    await this.driverService.setStatus(driverId, "AVAILABLE");

    const { id, patientId } = bookingData;
    this.notificationService.notifyPatient(patientId!, "booking:completed", {
      bookingId: id,
    });
    this.notificationService.notifyDriver(driverId, "booking:completed", {
      bookingId: id,
    });
  }
}
