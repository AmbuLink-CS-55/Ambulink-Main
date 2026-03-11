import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@/core/database/schema";
import type { CreateDriverDto, UpdateDriverDto } from "@/common/validation/schemas";
import type { NearbyDriver } from "@ambulink/types";
import { EventBusService } from "@/core/events/event-bus.service";
import { DriverApiRepository } from "./driver.api.repository";

@Injectable()
export class DriverApiService {
  constructor(
    private driverRepository: DriverApiRepository,
    private eventBus: EventBusService
  ) {}

  async create(createDriverDto: CreateDriverDto) {
    const result = await this.driverRepository.createDriver(createDriverDto);
    const created = result[0];
    if (created) {
      this.eventBus.publish({
        type: "realtime.dispatchers",
        event: "driver:roster",
        payload: {
          providerId: created.providerId,
          driver: created,
          action: "created",
        },
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
      this.eventBus.publish({
        type: "realtime.dispatchers",
        event: "driver:roster",
        payload: {
          providerId: updated.providerId,
          driver: updated,
          action: "updated",
        },
      });
    }
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.driverRepository.removeDriver(id);
    this.eventBus.publish({
      type: "realtime.dispatchers",
      event: "driver:roster",
      payload: {
        providerId: null,
        driver: { id },
        action: "removed",
      },
    });
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
}
