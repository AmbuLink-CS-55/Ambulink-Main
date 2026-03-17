import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AmbulanceProviderApiService } from "./ambulance-provider.api.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createAmbulanceProviderSchema,
  updateAmbulanceProviderSchema,
  type CreateAmbulanceProviderDto,
  type UpdateAmbulanceProviderDto,
} from "@/common/validation/schemas";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";

@Controller("api/ambulance-providers")
export class AmbulanceProviderApiController {
  constructor(private readonly ambulanceProviderService: AmbulanceProviderApiService) {}

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Post()
  create(
    @Body(Validate(createAmbulanceProviderSchema))
    body: CreateAmbulanceProviderDto
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

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateAmbulanceProviderSchema))
    body: UpdateAmbulanceProviderDto
  ) {
    return this.ambulanceProviderService.update(id, body);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceProviderService.remove(id);
  }
}
