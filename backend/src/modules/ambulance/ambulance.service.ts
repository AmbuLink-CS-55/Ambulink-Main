import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "@/database/db.service";
import { ambulance } from "@/database/schema";
import type {
  InsertAmbulanceDto,
  SelectAmbulanceDto,
} from "@/database/dto/ambulance.schema";
import Redis from "ioredis";
import { RedisService } from "@/database/redis.service";

@Injectable()
export class AmbulanceService {
  private redisClient: Redis;

  constructor(private db: DbService, private redis: RedisService) {
    this.redisClient = redis.getClient();
  }

  async create(
    createAmbulanceDto: InsertAmbulanceDto
  ): Promise<SelectAmbulanceDto> {
    const result = await this.db
      .getDb()
      .insert(ambulance)
      .values(createAmbulanceDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<SelectAmbulanceDto[]> {
    return this.db.getDb().select().from(ambulance);
  }

  async findOne(id: string): Promise<SelectAmbulanceDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(ambulance)
      .where(eq(ambulance.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: string,
    updateAmbulanceDto: Partial<InsertAmbulanceDto>
  ): Promise<SelectAmbulanceDto> {
    const result = await this.db
      .getDb()
      .update(ambulance)
      .set(updateAmbulanceDto)
      .where(eq(ambulance.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Ambulance with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.db.getDb().delete(ambulance).where(eq(ambulance.id, id));
  }

  updateAmbulanceLocation(ambulanceId: string, lat: number, lng: number) {
    // https://redis.io/docs/latest/commands/geoadd/
    this.redisClient.geoadd(
      "ambulances:locations",
      lng,
      lat,
      ambulanceId
    );
  }

  async findAmbulance(patientId: string, lat: number, lng: number){
    // https://redis.io/docs/latest/commands/georadius/
    const ambulances = await this.redisClient.georadius(
      "ambulances:locations",
      lng,
      lat,
      500000,
      "km",
      "WITHDIST",
      "COUNT",
      5,
      "ASC"
    );
    return ambulances
  }

}
