import { Injectable, NotFoundException } from "@nestjs/common";
import type { DriverLocationPayload } from "@ambulink/types";
import { BookingService } from "../booking/booking.service";
import { DriverService } from "./driver.service";
import { SocketService } from "@/common/socket/socket.service";

@Injectable()
export class DriverCommandService {
  private lastEmitTimes = new Map<string, number>();

  constructor(
    private driverService: DriverService,
    private bookingService: BookingService,
    private socketService: SocketService
  ) {}

  async updateLocation(driverId: string, data: DriverLocationPayload) {
    const { x, y } = data;
    await this.driverService.setDriverLocation(driverId, y, x);

    await this.bookingService.sendDriverLocation(driverId, { id: driverId, x, y });

    const now = Date.now();
    const lastEmit = this.lastEmitTimes.get(driverId) || 0;
    if (now - lastEmit > 1000) {
      this.socketService.emitToAllDispatchers("driver:update", {
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
    this.socketService.emitToPatient(patientId!, "booking:arrived", {
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
    this.socketService.emitToPatient(patientId!, "booking:completed", {
      bookingId: id,
    });
    this.socketService.emitToDriver(driverId, "booking:completed", {
      bookingId: id,
    });
  }
}
