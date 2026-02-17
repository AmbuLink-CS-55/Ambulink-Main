import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and, sql, isNotNull, asc } from "drizzle-orm";
import { bookings, User, users, UserStatus } from "@/common/database/schema";
import { DbService } from "@/common/database/db.service";
import { or } from "drizzle-orm";
import type { CreateDriverDto, UpdateDriverDto } from "@/common/validation/schemas";

@Injectable()
export class DriverService {
  constructor(private dbService: DbService) {}

  async create(createDriverDto: CreateDriverDto): Promise<User> {
    const result = await this.dbService.db
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

  async findAll(providerId?: string, isActive?: boolean): Promise<User[]> {
    const conditions = [eq(users.role, "DRIVER" as const)];

    if (providerId) {
      conditions.push(eq(users.providerId, providerId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    return this.dbService.db
      .select()
      .from(users)
      .where(and(...conditions));
  }

  async findOne(id: string): Promise<User> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DRIVER" as const)));

    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return result[0];
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<User> {
    await this.findOne(id);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateDriverDto.fullName !== undefined) updateData.fullName = updateDriverDto.fullName;
    if (updateDriverDto.phoneNumber !== undefined)
      updateData.phoneNumber = updateDriverDto.phoneNumber;
    if (updateDriverDto.email !== undefined) updateData.email = updateDriverDto.email;
    if (updateDriverDto.passwordHash !== undefined)
      updateData.passwordHash = updateDriverDto.passwordHash;
    if (updateDriverDto.providerId !== undefined)
      updateData.providerId = updateDriverDto.providerId as string | null;

    const result = await this.dbService.db
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
    await this.dbService.db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async setStatus(driverId: string, status: UserStatus) {
    await this.dbService.db
      .update(users)
      .set({
        status: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, driverId));
    console.log(driverId, "to", status);
  }

  async isAvailable(driverId: string) {
    const result = await this.dbService.db
      .select({ status: users.status })
      .from(users)
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));

    if (result.length === 0) return false;
    return result[0].status === "AVAILABLE";
  }

  async removeStatus(driverId: string) {
    await this.dbService.db
      .update(users)
      .set({
        status: null,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
  }

  async setDriverLocation(driverId: string, lat: number, lng: number) {
    if (lat === undefined || lng === undefined) return;

    const pointWkt = `POINT(${lng} ${lat})`;

    await this.dbService.db
      .update(users)
      .set({
        currentLocation: sql`ST_GeomFromText(${pointWkt}, 4326)`,
        lastLocationUpdate: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));
    console.info("[driver] location set", lat, lng);
  }

  async findDriverByLocation(lat: number, lng: number) {
    const distanceExpr = sql<number>`ST_Distance(
      ${users.currentLocation}::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    )`;

    const nearbyDrivers = await this.dbService.db
      .select()
      .from(users)
      // .innerJoin(
      //   ambulanceProviders,
      //   eq(users.providerId, ambulanceProviders.id)
      // )
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

  async getDriverBooking(driverId: string) {
    const [data] = await this.dbService.db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.driverId, driverId),
          or(eq(bookings.status, "ASSIGNED"), eq(bookings.status, "ARRIVED"))
        )
      );
    return data;
  }
}
