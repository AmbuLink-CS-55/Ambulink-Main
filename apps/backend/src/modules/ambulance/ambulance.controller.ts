import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AmbulanceService } from "./ambulance.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createAmbulanceSchema,
  updateAmbulanceSchema,
  type CreateAmbulanceDto,
  type UpdateAmbulanceDto,
} from "@/common/validation/schemas";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@Controller("api/ambulances")
@UseGuards(AuthGuard)
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  @Post()
  create(
    @Body(Validate(createAmbulanceSchema))
    body: CreateAmbulanceDto
  ) {
    return this.ambulanceService.create(body);
  }
  // uncomment after testing
  // @Post()
  // create(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Body(Validate(createAmbulanceSchema)) body: CreateAmbulanceDto
  // ) {
  //   // optional: enforce provider ownership
  //   return this.ambulanceService.create({
  //     ...body,
  //     providerId: body.providerId ?? user.providerId ?? undefined,
  //   });
  // }

  @Get()
  findAll(@Query("providerId") providerId?: string) {
    return this.ambulanceService.findAll(providerId);
  }
  //uncomment after testing
  // @Get()
  // findAll(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Query("providerId") providerId?: string
  // ) {
  //   // safer default: limit to user's provider unless explicitly allowed
  //   const effectiveProviderId = providerId ?? user.providerId ?? undefined;
  //   return this.ambulanceService.findAll(effectiveProviderId);
  // }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ambulanceService.findOne(id);
  }
  //uncomment after testing
  // @Get(":id")
  // findOne(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Param("id") id: string
  // ) {
  //   return this.ambulanceService.findOne(id);
  // }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateAmbulanceSchema))
    body: UpdateAmbulanceDto
  ) {
    return this.ambulanceService.update(id, body);
  }
  //uncomment after testing
  // @Patch(":id")
  // update(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Param("id") id: string,
  //   @Body(Validate(updateAmbulanceSchema)) body: UpdateAmbulanceDto
  // ) {
  //   return this.ambulanceService.update(id, body);
  // }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceService.remove(id);
  }
  //uncomment after testing
  // @Delete(":id")
  // remove(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Param("id") id: string
  // ) {
  //   return this.ambulanceService.remove(id);
  // }
}
