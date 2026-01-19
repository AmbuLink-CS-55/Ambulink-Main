import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { UserService } from "./user.service";
import {
  insertUserSchema,
  type InsertUserDto,
} from "../../db/dto/user.schema";
import { Validate } from "../../common/pipes/zod-validation.pipe";

@Controller("api/users")
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(
    @Body(Validate(insertUserSchema))
    body: InsertUserDto
  ) {
    return this.userService.create(body);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(insertUserSchema.partial()))
    body: Partial<InsertUserDto>
  ) {
    return this.userService.update(+id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.userService.remove(+id);
  }
}
