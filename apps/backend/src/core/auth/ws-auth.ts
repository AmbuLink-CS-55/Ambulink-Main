import { UnauthorizedException, ForbiddenException } from "@nestjs/common";
import type { Socket } from "socket.io";
import type { UserRole } from "@/core/database/schema";
import { TokenService } from "./token.service";
import type { AuthUser } from "./auth.types";
import { buildDevSocketUser, isAuthBypassed } from "./auth-bypass";

export function authenticateSocket(
  client: Socket,
  tokenService: TokenService,
  roles: UserRole[]
): AuthUser {
  if (isAuthBypassed()) {
    return buildDevSocketUser(client, roles);
  }

  const authToken = client.handshake.auth.token as string | undefined;
  const authHeader =
    (client.handshake.headers.authorization as string | undefined) ??
    (client.handshake.auth.authorization as string | undefined);

  const token = authToken ?? parseBearer(authHeader);
  if (!token) {
    throw new UnauthorizedException("Missing websocket token");
  }

  const user = tokenService.verify(token);
  if (!roles.includes(user.role)) {
    throw new ForbiddenException("Insufficient role");
  }

  return user;
}

function parseBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}
