import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and, sql, isNotNull, asc } from "drizzle-orm";
import { DbService } from "@/database/db.service";
import { ambulanceProviders, users } from "@/database/schema";
import type {
  InsertDriverDto,
  SelectDriverDto,
} from "@/common/dto/driver.schema";
import { WebsocketSessionService } from "@/services/websocket-session.service";
import Redis from "ioredis";
import { Socket } from "socket.io";

type DriverStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

@Injectable()
export class DriverService {

  constructor(
    private db: DbService,
    private websocketSessionService: WebsocketSessionService
  ) {}

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

  async setStatus(driverId: string, status: "AVAILABLE" | "BUSY" | "OFFLINE") {
    await this.db.getDb()
        .update(users)
        .set({
          status: status,
          updatedAt: new Date()
        })
        .where(eq(users.id, driverId));
    console.log(driverId, "to", status)
  }
  setWS(driverId: string, socket: Socket) {
    this.websocketSessionService.setDriverSocket(driverId, socket);
  }

  async getWS(driverId: string) {
    const socket = this.websocketSessionService.getDriverSocket(driverId);
    if (socket) return socket;
  }

  async isAvailable(driverId: string) {
    const result = await this.db
      .getDb()
      .select({ status: users.status })
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));

    if (result.length === 0) return false;
    return result[0].status === "AVAILABLE";
  }

  async removeStatus(driverId: string) {
    await this.db
      .getDb()
      .update(users)
      .set({
        status: null,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    await this.db
      .getDb()
      .update(users)
      .set({
        currentLocation: sql`ST_GeomFromText('POINT(${lng} ${lat})', 4326)`,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  async findDriverByLocation(lat: number, lng: number) {
    const distanceExpr = sql<number>`ST_Distance(
      ${users.currentLocation}::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    )`;

    const nearbyDrivers = await this.db.getDb()
      .select({
        id: users.id,
        phoneNumber: users.phoneNumber,
        lat: sql<number>`ST_Y(${users.currentLocation})`,
        lng: sql<number>`ST_X(${users.currentLocation})`,
        ambulance_provider: {
          id: ambulanceProviders.id,
          name: ambulanceProviders.name,
        },
        distance: distanceExpr,
      })
      .from(users)
      .innerJoin(ambulanceProviders, eq(users.providerId, ambulanceProviders.id))
      .where(
        and(
          eq(users.role, "DRIVER"),
          eq(users.isActive, true),
          eq(users.status, "AVAILABLE"),
          isNotNull(users.currentLocation)
        )
      )
      .orderBy(asc(distanceExpr))
      .limit(3);
    return nearbyDrivers;
  }

}
