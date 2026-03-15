import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyAuthToken } from "./auth-token";
import type { AuthUser } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined>; query?: Record<string, unknown>; user?: AuthUser }>();

    const authHeader = request.headers.authorization;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;
    const queryTokenRaw = request.query?.accessToken;
    const queryToken = typeof queryTokenRaw === "string" ? queryTokenRaw : null;
    const token = bearer || queryToken;

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
    };

    return true;
  }
}
