import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  dispatcherInviteCreateSchema,
  type DispatcherInviteCreateDto,
} from "@/common/validation/schemas";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";
import { AuthService } from "@/modules/auth/auth.service";

@UseGuards(AuthGuard, DispatcherRoleGuard)
@Controller("api/dispatchers")
export class DispatcherApiController {
  constructor(private readonly authService: AuthService) {}

  @Post("invites")
  createInvite(
    @Body(Validate(dispatcherInviteCreateSchema)) body: DispatcherInviteCreateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.authService.createDispatcherInvite(body, user);
  }
}
