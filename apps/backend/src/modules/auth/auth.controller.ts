import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  dispatcherInviteCreateSchema,
  dispatcherLoginSchema,
  dispatcherSignupSchema,
  type DispatcherInviteCreateDto,
  type DispatcherLoginDto,
  type DispatcherSignupDto,
} from "@/common/validation/schemas";
import { AuthService } from "./auth.service";
import { CurrentUser } from "@/common/auth/auth.decorators";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import type { AuthUser } from "@/common/auth/auth.types";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("dispatcher/login")
  loginDispatcher(@Body(Validate(dispatcherLoginSchema)) body: DispatcherLoginDto) {
    return this.authService.loginDispatcher(body);
  }

  @Post("dispatcher/signup")
  signupDispatcher(@Body(Validate(dispatcherSignupSchema)) body: DispatcherSignupDto) {
    return this.authService.signupDispatcher(body);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Post("dispatcher/invites")
  createDispatcherInvite(
    @Body(Validate(dispatcherInviteCreateSchema)) body: DispatcherInviteCreateDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.authService.createDispatcherInvite(body, user);
  }

  @UseGuards(AuthGuard, DispatcherRoleGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }
}
