import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { AmbulanceProviderService } from "./ambulance-provider.service";
import {
  insertAmbulanceProviderSchema,
  type InsertAmbulanceProviderDto,
} from "@/common/dto/ambulance-provider.schema";
import { Validate } from "@/common/pipes/zod-validation.pipe";

@Controller("api/ambulance-providers")
export class AmbulanceProviderController {
  constructor(
    private readonly ambulanceProviderService: AmbulanceProviderService
  ) {}

  @Post()
  create(
    @Body(Validate(insertAmbulanceProviderSchema))
    body: InsertAmbulanceProviderDto
  ) {
    return this.ambulanceProviderService.create(body);
  }

  @Get()
  findAll() {
    return this.ambulanceProviderService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ambulanceProviderService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(insertAmbulanceProviderSchema.partial()))
    body: Partial<InsertAmbulanceProviderDto>
  ) {
    return this.ambulanceProviderService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceProviderService.remove(id);
  }
}
