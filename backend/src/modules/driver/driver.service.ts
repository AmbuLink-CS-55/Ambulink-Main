import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { driver } from "../../db/schema";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { DriverResponseDto } from "./dto/driver-response.dto";

@Injectable()
export class DriverService {
  constructor(private db: DbService) {}

  async create(createDriverDto: CreateDriverDto): Promise<DriverResponseDto> {
    const result = await this.db
      .getDb()
      .insert(driver)
      .values(createDriverDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<DriverResponseDto[]> {
    return this.db.getDb().select().from(driver);
  }

  async findOne(id: number): Promise<DriverResponseDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(driver)
      .where(eq(driver.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: number,
    updateDriverDto: UpdateDriverDto
  ): Promise<DriverResponseDto> {
    const result = await this.db
      .getDb()
      .update(driver)
      .set(updateDriverDto)
      .where(eq(driver.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.db.getDb().delete(driver).where(eq(driver.id, id));
  }
}
