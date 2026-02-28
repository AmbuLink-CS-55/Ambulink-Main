import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@/core/database/schema";
import { SocketService } from "@/core/socket/socket.service";
import type { CreateDriverDto, UpdateDriverDto } from "@/common/validation/schemas";
import type { NearbyDriver } from "@ambulink/types";
import { DriverRepository } from "./driver.repository";

@Injectable()
export class DriverService {
  constructor(
    private driverRepository: DriverRepository,
    private socketService: SocketService
  ) {}

  async create(createDriverDto: CreateDriverDto) {
    const result = await this.driverRepository.createDriver(createDriverDto);
    const created = result[0];
    if (created) {
      this.socketService.emitToAllDispatchers("driver:roster", {
        providerId: created.providerId,
        driver: created,
        action: "created",
      });
    }
    return created;
  }

  async findAll(providerId?: string, isActive?: boolean, status?: UserStatus) {
    return this.driverRepository.findAllDrivers(providerId, isActive, status);
  }

  async findOne(id: string) {
    const result = await this.driverRepository.findDriverById(id);

    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    await this.findOne(id);

    const result = await this.driverRepository.updateDriver(id, updateDriverDto);

    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    const updated = result[0];
    if (updated) {
      this.socketService.emitToAllDispatchers("driver:roster", {
        providerId: updated.providerId,
        driver: updated,
        action: "updated",
      });
    }
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.driverRepository.removeDriver(id);
    this.socketService.emitToAllDispatchers("driver:roster", {
      providerId: null,
      driver: { id },
      action: "removed",
    });
  }

  async setStatus(driverId: string, status: UserStatus) {
    const result = await this.driverRepository.setDriverStatus(driverId, status);
    const updated = result[0];
    if (updated) {
      this.socketService.emitToAllDispatchers("driver:roster", {
        providerId: updated.providerId,
        driver: updated,
        action: "updated",
      });
    }
    return updated;
  }

  async isAvailable(driverId: string) {
    const result = await this.driverRepository.checkDriverAvailability(driverId);

    if (result.length === 0) return false;
    return result[0].status === "AVAILABLE";
  }

  async removeStatus(driverId: string) {
    await this.driverRepository.removeDriverStatus(driverId);
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    if (lat === undefined || lng === undefined) return;

    await this.driverRepository.setDriverLocation(driverId, lat, lng);
  }

  async clearDriverLocation(driverId: string) {
    await this.driverRepository.clearDriverLocation(driverId);
  }

  async findDriverByLocation(lat: number, lng: number) {
    const nearbyDrivers = await this.driverRepository.findDriversByLocation(lat, lng);
    return nearbyDrivers;
  }

  async findNearby(lat: number, lng: number, limit: number): Promise<NearbyDriver[]> {
    const rows = await this.driverRepository.findNearbyDriversForMap(lat, lng, limit);

    return rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      phoneNumber: row.phoneNumber,
      providerId: row.providerId,
      status: row.status,
      location:
        row.locationX !== null && row.locationY !== null
          ? { x: row.locationX, y: row.locationY }
          : null,
      distanceMeters: Number(row.distanceMeters),
      distanceKm: Number((Number(row.distanceMeters) / 1000).toFixed(2)),
    }));
  }

  async getDriverBooking(driverId: string) {
    const data = await this.driverRepository.getDriverBooking(driverId);
    return data[0];
  }
}
