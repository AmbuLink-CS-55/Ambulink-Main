import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  dispatcherBootstrapSignupSchema,
  dispatcherLoginSchema,
  dispatcherSignupSchema,
  staffInviteActivateSchema,
  staffInvitePreviewQuerySchema,
  staffLoginSchema,
  staffSignupSchema,
  type StaffInviteActivateDto,
  type StaffInvitePreviewQueryDto,
  type DispatcherBootstrapSignupDto,
  type DispatcherLoginDto,
  type DispatcherSignupDto,
  type StaffLoginDto,
  type StaffSignupDto,
} from "@/common/validation/schemas";
import { AuthService } from "./auth.service";
import { CurrentUser } from "@/common/auth/auth.decorators";
import { AuthGuard } from "@/common/auth/auth.guard";
import type { AuthUser } from "@/common/auth/auth.types";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("dispatcher/login")
  loginDispatcher(@Body(Validate(dispatcherLoginSchema)) body: DispatcherLoginDto) {
    return this.authService.loginDispatcher(body);
  }

  @Post("staff/login")
  loginStaff(@Body(Validate(staffLoginSchema)) body: StaffLoginDto) {
    return this.authService.loginStaff(body);
  }

  @Post("dispatcher/signup")
  signupDispatcher(@Body(Validate(dispatcherSignupSchema)) body: DispatcherSignupDto) {
    return this.authService.signupDispatcher(body);
  }

  @Post("dispatcher/bootstrap-signup")
  bootstrapDispatcherSignup(
    @Body(Validate(dispatcherBootstrapSignupSchema)) body: DispatcherBootstrapSignupDto
  ) {
    return this.authService.bootstrapDispatcherSignup(body);
  }

  @Post("staff/signup")
  signupStaff(@Body(Validate(staffSignupSchema)) body: StaffSignupDto) {
    return this.authService.signupStaff(body);
  }

  @Get("staff/invites/preview")
  previewStaffInvite(
    @Query(Validate(staffInvitePreviewQuerySchema)) query: StaffInvitePreviewQueryDto
  ) {
    return this.authService.previewStaffInvite(query.inviteToken);
  }

  @Post("staff/invites/activate")
  activateStaffInvite(@Body(Validate(staffInviteActivateSchema)) body: StaffInviteActivateDto) {
    return this.authService.activateStaffInvite(body);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }
}
