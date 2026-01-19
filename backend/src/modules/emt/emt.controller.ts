import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { EmtService } from "./emt.service";
import { insertEmtSchema, type InsertEmtDto } from "../../db/dto/emt.schema";
import { Validate } from "../../common/pipes/zod-validation.pipe";

@Controller("api/emts")
export class EmtController {
  constructor(private readonly emtService: EmtService) { }

  @Post()
  create(
    @Body(Validate(insertEmtSchema))
    body: InsertEmtDto
  ) {
    return this.emtService.create(body);
  }

  @Get()
  findAll() {
    return this.emtService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.emtService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(insertEmtSchema.partial()))
    body: Partial<InsertEmtDto>
  ) {
    return this.emtService.update(+id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.emtService.remove(+id);
  }
}
