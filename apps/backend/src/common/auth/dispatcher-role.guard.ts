import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthUser } from "./auth.types";

@Injectable()
export class DispatcherRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user || user.role !== "DISPATCHER") {
      throw new ForbiddenException("Dispatcher role is required");
    }

    if (!user.providerId) {
      throw new ForbiddenException("Dispatcher must belong to a provider");
    }

    return true;
  }
}
