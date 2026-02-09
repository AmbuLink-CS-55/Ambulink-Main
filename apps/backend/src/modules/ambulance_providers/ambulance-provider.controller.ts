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
import { Validate } from "@/common/pipes/zod-validation.pipe";
import type { AmbulanceProvider, NewAmbulanceProvider } from "@/common/database/schema";

@Controller("api/ambulance-providers")
export class AmbulanceProviderController {
  constructor(
    private readonly ambulanceProviderService: AmbulanceProviderService
  ) {}

  @Post()
  create(
    // @Body(Validate(insertAmbulanceProviderSchema))
    body: AmbulanceProvider
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
    // @Body(Validate(insertAmbulanceProviderSchema.partial()))
    body: Partial<NewAmbulanceProvider>
  ) {
    return this.ambulanceProviderService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceProviderService.remove(id);
  }
}
