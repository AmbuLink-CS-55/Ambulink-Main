import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createDispatcherSchema,
  dispatcherListQuerySchema,
  dispatcherInviteCreateSchema,
  staffInviteCreateSchema,
  updateDispatcherSchema,
  type CreateDispatcherDto,
  type DispatcherListQueryDto,
  type DispatcherInviteCreateDto,
  type StaffInviteCreateDto,
  type UpdateDispatcherDto,
} from "@/common/validation/schemas";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { DispatcherAdminGuard } from "@/common/auth/dispatcher-admin.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";
import { AuthService } from "@/modules/auth/auth.service";
import { DispatcherApiService } from "./dispatcher.api.service";

@UseGuards(AuthGuard, DispatcherRoleGuard)
@Controller("api")
export class DispatcherApiController {
  constructor(
    private readonly authService: AuthService,
    private readonly dispatcherService: DispatcherApiService
  ) {}

  @Post("dispatchers")
  @UseGuards(DispatcherAdminGuard)
  createDispatcher(
    @Body(Validate(createDispatcherSchema)) body: CreateDispatcherDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.dispatcherService.create({
      ...body,
      providerId: user.providerId ?? undefined,
    });
  }

  @Get("dispatchers")
  findAllDispatchers(
    @Query(Validate(dispatcherListQuerySchema)) query: DispatcherListQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.dispatcherService.findAll(user.providerId ?? undefined, query.isActive, query.status);
  }

  @Patch("dispatchers/:id")
  @UseGuards(DispatcherAdminGuard)
  updateDispatcher(
    @Param("id") id: string,
    @Body(Validate(updateDispatcherSchema)) body: UpdateDispatcherDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.dispatcherService.update(
      id,
      {
        ...body,
        providerId: undefined,
      },
      user.providerId ?? undefined
    );
  }

  @Delete("dispatchers/:id")
  @UseGuards(DispatcherAdminGuard)
  removeDispatcher(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.dispatcherService.remove(id, user.providerId ?? undefined);
  }

  @Post("staff-invites")
  @UseGuards(DispatcherAdminGuard)
  createStaffInvite(
    @Body(Validate(staffInviteCreateSchema)) body: StaffInviteCreateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.authService.createStaffInvite(body, user);
  }

  @Post("dispatchers/invites")
  @UseGuards(DispatcherAdminGuard)
  createDispatcherInvite(
    @Body(Validate(dispatcherInviteCreateSchema)) body: DispatcherInviteCreateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.authService.createStaffInvite(
      {
        ...body,
        role: "DISPATCHER",
      },
      user
    );
  }
}
