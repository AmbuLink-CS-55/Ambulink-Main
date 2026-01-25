import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DbService } from "@/database/db.service";
import { users } from "@/database/schema";
import type {
  InsertDriverDto,
  SelectDriverDto,
} from "@/common/dto/driver.schema";
import { RedisService } from "@/database/redis.service";
import Redis from "ioredis";

type DriverStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

@Injectable()
export class DriverService {
  static onlineDrivers = new Map<string, string>();
  // patientID : socketID
  driverIdSocketMap = new Map<string, string>();

  private redisClient: Redis;

  constructor(
    private db: DbService,
    private redis: RedisService
  ) {
    this.redisClient = redis.getClient();
  }

  async create(createDriverDto: InsertDriverDto): Promise<SelectDriverDto> {
    const result = await this.db
      .getDb()
      .insert(users)
      .values({
        fullName: createDriverDto.fullName,
        phoneNumber: createDriverDto.phoneNumber,
        email: createDriverDto.email,
        passwordHash: createDriverDto.passwordHash,
        role: "DRIVER",
        providerId: createDriverDto.providerId as string | null,
      })
      .returning();
    return result[0];
  }

  async findAll(
    providerId?: string,
    isActive?: boolean
  ): Promise<SelectDriverDto[]> {
    const conditions = [eq(users.role, "DRIVER" as const)];

    if (providerId) {
      conditions.push(eq(users.providerId, providerId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    return this.db
      .getDb()
      .select()
      .from(users)
      .where(and(...conditions));
  }

  async findOne(id: string): Promise<SelectDriverDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DRIVER" as const)));

    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: string,
    updateDriverDto: Partial<InsertDriverDto>
  ): Promise<SelectDriverDto> {
    await this.findOne(id);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateDriverDto.fullName !== undefined)
      updateData.fullName = updateDriverDto.fullName;
    if (updateDriverDto.phoneNumber !== undefined)
      updateData.phoneNumber = updateDriverDto.phoneNumber;
    if (updateDriverDto.email !== undefined)
      updateData.email = updateDriverDto.email;
    if (updateDriverDto.passwordHash !== undefined)
      updateData.passwordHash = updateDriverDto.passwordHash;
    if (updateDriverDto.providerId !== undefined)
      updateData.providerId = updateDriverDto.providerId as string | null;

    const result = await this.db
      .getDb()
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.db
      .getDb()
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  setStatus(driverId: string, status: "AVAILABLE" | "BUSY" | "OFFLINE" | "UNKNOWN") {
    if (status === "UNKNOWN") {
      // const driverData = this.redisClient.hgetall(`driver:${driverId}`)
      // NOTE: handle possible reconnection for every new connection later
      status = "AVAILABLE"
    }
    return this.redisClient.hset(`driver:${driverId}`, "status", status);
  }
  setWS(driverId: string, socketId: string) {
    this.redisClient.hset(`driver:${driverId}`, 'socketId', socketId);
  }
  getWS(driverId: string) {
    return this.redisClient.hget(`driver:${driverId}`, 'socketId')
  }
  async isAvailable(driverId: string) {
    const status = await this.redisClient.hget(`drivers:${driverId}`, "status");
    return status === "AVAILABLE";
  }
  async removeStatus(driverId: string) {
    await this.redisClient.hdel("drivers:status", driverId);
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    await this.redisClient.geoadd("driver:locations", lng, lat, driverId);
    // await this.redisClient.expire("driver:locations", 300);
  }

  async findDriverByLocation(lat: number, lng: number) {
    // driverID, distance
    const results = (await this.redisClient.georadius(
      "driver:locations",
      lng,
      lat,
      500000,
      "km",
      "WITHDIST",
      "COUNT",
      5,
      "ASC"
    )) as Array<[string, string]>;

    const available = results.filter(([driverId, distKm]) => {
      const driverStatus =
        DriverService.onlineDrivers.get(driverId) ?? "OFFLINE";
      return driverStatus === "AVAILABLE";
    });

    return available;
  }

}
