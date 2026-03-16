import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AmbulanceApiService } from "./ambulance.api.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createAmbulanceSchema,
  updateAmbulanceSchema,
  type CreateAmbulanceDto,
  type UpdateAmbulanceDto,
} from "@/common/validation/schemas";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";

@UseGuards(AuthGuard, DispatcherRoleGuard)
@Controller("api/ambulances")
export class AmbulanceApiController {
  constructor(private readonly ambulanceService: AmbulanceApiService) {}

  @Post()
  create(
    @Body(Validate(createAmbulanceSchema))
    body: CreateAmbulanceDto,
    @CurrentUser() user: AuthUser
  ) {
    if (!user.providerId) {
      throw new BadRequestException("Dispatcher provider is required");
    }
    return this.ambulanceService.create({
      ...body,
      providerId: user.providerId,
    });
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.ambulanceService.findAll(user.providerId ?? undefined);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.ambulanceService.findOne(id, user.providerId ?? undefined);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateAmbulanceSchema))
    body: UpdateAmbulanceDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.ambulanceService.update(id, {
      ...body,
      providerId: undefined,
    }, user.providerId ?? undefined);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.ambulanceService.remove(id, user.providerId ?? undefined);
  }
}
