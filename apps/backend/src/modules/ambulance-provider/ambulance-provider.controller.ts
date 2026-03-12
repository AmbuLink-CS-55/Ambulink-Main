import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AmbulanceProviderService } from "./ambulance-provider.service";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createAmbulanceProviderSchema,
  updateAmbulanceProviderSchema,
  type CreateAmbulanceProviderDto,
  type UpdateAmbulanceProviderDto,
} from "@/common/validation/schemas";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@/common/guards/auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

@Controller("api/ambulance-providers")
@UseGuards(AuthGuard)
export class AmbulanceProviderController {
  constructor(private readonly ambulanceProviderService: AmbulanceProviderService) {}

  @Post()
  create(
    @Body(Validate(createAmbulanceProviderSchema))
    body: CreateAmbulanceProviderDto
  ) {
    return this.ambulanceProviderService.create(body);
  }
  //uncomment after testing
  // @Post()
  // create(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Body(Validate(createAmbulanceProviderSchema)) body: CreateAmbulanceProviderDto
  // ) {
  //   return this.ambulanceProviderService.create(body);
  // }

  @Get()
  findAll() {
    return this.ambulanceProviderService.findAll();
  }
  //uncomment after testing
  // @Get()
  // findAll(@CurrentUser() user: { id: string; role?: string; providerId?: string | null }) {
  //   return this.ambulanceProviderService.findAll();
  // }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ambulanceProviderService.findOne(id);
  }
  //uncomment after testing
  // @Get(":id")
  // findOne(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Param("id") id: string
  // ) {
  //   return this.ambulanceProviderService.findOne(id);
  // }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateAmbulanceProviderSchema))
    body: UpdateAmbulanceProviderDto
  ) {
    return this.ambulanceProviderService.update(id, body);
  }
  //uncomment after testing
  // @Patch(":id")
  // update(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Param("id") id: string,
  //   @Body(Validate(updateAmbulanceProviderSchema)) body: UpdateAmbulanceProviderDto
  // ) {
  //   return this.ambulanceProviderService.update(id, body);
  // }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceProviderService.remove(id);
  }
  //uncomment after testing
  // @Delete(":id")
  // remove(
  //   @CurrentUser() user: { id: string; role?: string; providerId?: string | null },
  //   @Param("id") id: string
  // ) {
  //   return this.ambulanceProviderService.remove(id);
  // }
}
