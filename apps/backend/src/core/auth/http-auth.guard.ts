import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { ROLES_KEY } from "./roles.decorator";
import { TokenService } from "./token.service";
import type { UserRole } from "@/core/database/schema";
import { buildDevHttpUser, isAuthBypassed } from "./auth-bypass";

@Injectable()
export class HttpAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isAuthBypassed()) {
      request.user = buildDevHttpUser(requiredRoles);
      return true;
    }

    const authorization = request.headers.authorization as string | undefined;
    if (!authorization) {
      throw new UnauthorizedException("Missing authorization header");
    }

    const [type, token] = authorization.split(" ");
    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid authorization header");
    }

    const user = this.tokenService.verify(token);
    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient role");
    }

    request.user = user;
    return true;
  }
}
