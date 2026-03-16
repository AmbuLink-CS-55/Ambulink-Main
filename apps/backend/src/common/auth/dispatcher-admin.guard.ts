import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthUser } from "./auth.types";

@Injectable()
export class DispatcherAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user || user.role !== "DISPATCHER" || !user.providerId) {
      throw new ForbiddenException("Dispatcher role is required");
    }

    if (!user.isDispatcherAdmin) {
      throw new ForbiddenException("Dispatcher admin privileges are required");
    }

    return true;
  }
}
