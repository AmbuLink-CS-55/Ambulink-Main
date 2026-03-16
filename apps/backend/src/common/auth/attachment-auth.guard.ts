import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyAuthToken } from "./auth-token";
import type { AuthUser } from "./auth.types";

@Injectable()
export class AttachmentAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      query?: Record<string, unknown>;
      user?: AuthUser;
    }>();

    const authHeader = request.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    const queryToken = request.query?.accessToken;
    const token =
      bearerToken ||
      (typeof queryToken === "string" && queryToken.length > 0 ? queryToken : null);

    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    request.user = {
      id: payload.sub,
      role: payload.role,
      providerId: payload.providerId,
      email: payload.email,
      fullName: payload.fullName,
      isDispatcherAdmin: payload.isDispatcherAdmin ?? false,
    };

    return true;
  }
}
