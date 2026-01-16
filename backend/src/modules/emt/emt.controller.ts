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
import { CreateEmtDto } from "./dto/create-emt.dto";
import { UpdateEmtDto } from "./dto/update-emt.dto";

@Controller("emts")
export class EmtController {
  constructor(private readonly emtService: EmtService) {}

  @Post()
  create(@Body() createEmtDto: CreateEmtDto) {
    return this.emtService.create(createEmtDto);
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
  update(@Param("id") id: string, @Body() updateEmtDto: UpdateEmtDto) {
    return this.emtService.update(+id, updateEmtDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.emtService.remove(+id);
  }
}
