import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { user } from "../../db/schema";
import type {
  InsertUserDto,
  SelectUserDto,
} from "../../db/schemas/user.schema";

@Injectable()
export class UserService {
  constructor(private db: DbService) {}

  async create(createUserDto: InsertUserDto): Promise<SelectUserDto> {
    const result = await this.db
      .getDb()
      .insert(user)
      .values(createUserDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<SelectUserDto[]> {
    return this.db.getDb().select().from(user);
  }

  async findOne(id: number): Promise<SelectUserDto> {
    const result = await this.db
      .getDb()
      .select()
      .from(user)
      .where(eq(user.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return result[0];
  }

  async update(
    id: number,
    updateUserDto: Partial<InsertUserDto>
  ): Promise<SelectUserDto> {
    const result = await this.db
      .getDb()
      .update(user)
      .set(updateUserDto)
      .where(eq(user.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return result[0];
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.db.getDb().delete(user).where(eq(user.id, id));
  }
}
