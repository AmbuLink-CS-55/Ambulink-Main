import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import { SocketService } from "@/common/socket/socket.service";
import type { CreateDriverDto, UpdateDriverDto } from "@/common/validation/schemas";
import type { NearbyDriver } from "@ambulink/types";
import {
  createDriver,
  findAllDrivers,
  findDriverById,
  updateDriver,
  removeDriver,
  setDriverStatus,
  checkDriverAvailability,
  removeDriverStatus,
  setDriverLocation,
  findDriversByLocation,
  findNearbyDriversForMap,
  getDriverBooking,
} from "@/common/queries";

@Injectable()
export class DriverService {
  constructor(
    private dbService: DbService,
    private socketService: SocketService
  ) {}

  async create(createDriverDto: CreateDriverDto) {
    const result = await createDriver(this.dbService.db, createDriverDto);
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
    return findAllDrivers(this.dbService.db, providerId, isActive, status);
  }

  async findOne(id: string) {
    const result = await findDriverById(this.dbService.db, id);

    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    await this.findOne(id);

    const result = await updateDriver(this.dbService.db, id, updateDriverDto);

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
    await removeDriver(this.dbService.db, id);
    this.socketService.emitToAllDispatchers("driver:roster", {
      providerId: null,
      driver: { id },
      action: "removed",
    });
  }

  async setStatus(driverId: string, status: UserStatus) {
    await setDriverStatus(this.dbService.db, driverId, status);
  }

  async isAvailable(driverId: string) {
    const result = await checkDriverAvailability(this.dbService.db, driverId);

    if (result.length === 0) return false;
    return result[0].status === "AVAILABLE";
  }

  async removeStatus(driverId: string) {
    await removeDriverStatus(this.dbService.db, driverId);
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    if (lat === undefined || lng === undefined) return;

    await setDriverLocation(this.dbService.db, driverId, lat, lng);
  }

  async findDriverByLocation(lat: number, lng: number) {
    const nearbyDrivers = await findDriversByLocation(this.dbService.db, lat, lng);
    return nearbyDrivers;
  }

  async findNearby(lat: number, lng: number, limit: number): Promise<NearbyDriver[]> {
    const rows = await findNearbyDriversForMap(this.dbService.db, lat, lng, limit);

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
    const data = await getDriverBooking(this.dbService.db, driverId);
    return data[0];
  }
}
