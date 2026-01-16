import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { service } from "../../db/schema";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServiceResponseDto } from "./dto/service-response.dto";

@Injectable()
export class ServiceService {
  constructor(private db: DbService) {}

  async create(
    createServiceDto: CreateServiceDto
  ): Promise<ServiceResponseDto> {
    const result = await this.db
      .getDb()
      .insert(service)
      .values(createServiceDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<ServiceResponseDto[]> {
    return this.db.getDb().select().from(service);
  }

  async findOne(id: number): Promise<ServiceResponseDto> {
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
    updateServiceDto: UpdateServiceDto
  ): Promise<ServiceResponseDto> {
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
