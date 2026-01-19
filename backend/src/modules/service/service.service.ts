import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { service } from "../../db/schema";
import type {
  InsertServiceDto,
  SelectServiceDto,
} from "../../db/dto/service.schema";

@Injectable()
export class ServiceService {
  constructor(private db: DbService) { }

  async create(createServiceDto: InsertServiceDto): Promise<SelectServiceDto> {
    const result = await this.db
      .getDb()
      .insert(service)
      .values(createServiceDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<SelectServiceDto[]> {
    return this.db.getDb().select().from(service);
  }

  async findOne(id: number): Promise<SelectServiceDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(service)
      .where(eq(service.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: number,
    updateServiceDto: Partial<InsertServiceDto>
  ): Promise<SelectServiceDto> {
    const result = await this.db
      .getDb()
      .update(service)
      .set(updateServiceDto)
      .where(eq(service.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.db.getDb().delete(service).where(eq(service.id, id));
  }
}
