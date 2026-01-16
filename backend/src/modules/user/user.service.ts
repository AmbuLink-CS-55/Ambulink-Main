import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DbService } from "../../db/db.service";
import { user } from "../../db/schema";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";

@Injectable()
export class UserService {
  constructor(private db: DbService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const result = await this.db
      .getDb()
      .insert(user)
      .values(createUserDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<UserResponseDto[]> {
    return this.db.getDb().select().from(user);
  }

  async findOne(id: number): Promise<UserResponseDto> {
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
    updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
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
