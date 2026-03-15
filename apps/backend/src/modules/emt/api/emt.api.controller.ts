import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createEmtSchema,
  emtBookingSearchQuerySchema,
  emtListQuerySchema,
  updateEmtSchema,
  type CreateEmtDto,
  type EmtBookingSearchQueryDto,
  type EmtListQueryDto,
  type UpdateEmtDto,
} from "@/common/validation/schemas";
import { EmtApiService } from "./emt.api.service";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { DispatcherAdminGuard } from "@/common/auth/dispatcher-admin.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";

@UseGuards(AuthGuard, DispatcherRoleGuard)
@Controller("api/emts")
export class EmtApiController {
  constructor(private readonly emtService: EmtApiService) {}

  @Post()
  @UseGuards(DispatcherAdminGuard)
  create(
    @Body(Validate(createEmtSchema))
    body: CreateEmtDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.emtService.create({
      ...body,
      providerId: user.providerId ?? undefined,
    });
  }

  @Get()
  findAll(
    @Query(Validate(emtListQuerySchema)) query: EmtListQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.emtService.findAll(user.providerId ?? undefined, query.isActive, query.status);
  }

  @Get("bookings/search")
  searchBookings(
    @Query("emtId") emtId: string | undefined,
    @Query(Validate(emtBookingSearchQuerySchema)) query: EmtBookingSearchQueryDto
  ) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    return this.emtService.searchOngoingBookings(emtId, query.q, query.limit);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.emtService.findOne(id, user.providerId ?? undefined);
  }

  @Patch(":id")
  @UseGuards(DispatcherAdminGuard)
  update(
    @Param("id") id: string,
    @Body(Validate(updateEmtSchema))
    body: UpdateEmtDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.emtService.update(id, {
      ...body,
      providerId: undefined,
    }, user.providerId ?? undefined);
  }

  @Delete(":id")
  @UseGuards(DispatcherAdminGuard)
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.emtService.remove(id, user.providerId ?? undefined);
  }
}
