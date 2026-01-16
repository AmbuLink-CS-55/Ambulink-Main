import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { emt } from "../../db/schema";
import type { InsertEmtDto, SelectEmtDto } from "../../db/schemas/emt.schema";

@Injectable()
export class EmtService {
  constructor(private db: DbService) {}

  async create(createEmtDto: InsertEmtDto): Promise<SelectEmtDto> {
    const result = await this.db
      .getDb()
      .insert(emt)
      .values(createEmtDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<SelectEmtDto[]> {
    return this.db.getDb().select().from(emt);
  }

  async findOne(id: number): Promise<SelectEmtDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(emt)
      .where(eq(emt.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Emt with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: number,
    updateEmtDto: Partial<InsertEmtDto>
  ): Promise<SelectEmtDto> {
    const result = await this.db
      .getDb()
      .update(emt)
      .set(updateEmtDto)
      .where(eq(emt.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Emt with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.db.getDb().delete(emt).where(eq(emt.id, id));
  }
}
