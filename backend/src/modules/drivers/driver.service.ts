import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DbService } from "@/database/db.service";
import { users } from "@/database/schema";
import type {
  InsertDriverDto,
  SelectDriverDto,
} from "@/database/dto/driver.schema";

@Injectable()
export class DriverService {
  constructor(private db: DbService) {}

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
}
