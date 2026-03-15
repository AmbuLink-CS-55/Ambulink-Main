import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { DispatcherAdminGuard } from "@/common/auth/dispatcher-admin.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthGuard, DispatcherRoleGuard, DispatcherAdminGuard],
  exports: [AuthService, AuthRepository, AuthGuard, DispatcherRoleGuard, DispatcherAdminGuard],
})
export class AuthModule {}
