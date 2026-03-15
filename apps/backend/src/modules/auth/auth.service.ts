import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import type {
  DispatcherInviteCreateDto,
  DispatcherLoginDto,
  DispatcherSignupDto,
} from "@/common/validation/schemas";
import { hashPassword, verifyPassword } from "@/common/auth/password-hasher";
import { signAuthToken } from "@/common/auth/auth-token";
import type { AuthUser } from "@/common/auth/auth.types";
import { AuthRepository } from "./auth.repository";

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private inviteTokenHash(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private mapDbUserToAuthUser(user: {
    id: string;
    fullName: string | null;
    email: string | null;
    role: "PATIENT" | "DISPATCHER" | "DRIVER" | "EMT";
    providerId: string | null;
  }): AuthUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      providerId: user.providerId,
    };
  }

  async loginDispatcher(dto: DispatcherLoginDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const [dispatcher] = await this.authRepository.findDispatcherByEmail(normalizedEmail);

    if (!dispatcher || !dispatcher.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!verifyPassword(dto.password, dispatcher.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = this.mapDbUserToAuthUser(dispatcher);
    const token = signAuthToken(user);
    await this.authRepository.touchLastLogin(user.id);

    return {
      accessToken: token.accessToken,
      expiresInSeconds: token.expiresInSeconds,
      user,
    };
  }

  async signupDispatcher(dto: DispatcherSignupDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);

    let providerId = dto.providerId;

    if (dto.inviteToken) {
      const hashedToken = this.inviteTokenHash(dto.inviteToken.trim());
      const [invite] = await this.authRepository.findActiveInviteByTokenHash(hashedToken);
      if (!invite) {
        throw new BadRequestException("Invalid or expired invite token");
      }

      if (invite.invitedEmail && invite.invitedEmail.toLowerCase() !== normalizedEmail) {
        throw new BadRequestException("Invite is issued for a different email address");
      }

      providerId = invite.providerId;
    }

    if (!providerId) {
      throw new BadRequestException("providerId is required when inviteToken is not provided");
    }

    const [provider] = await this.authRepository.findProviderById(providerId);
    if (!provider || !provider.isActive) {
      throw new NotFoundException("Provider not found or inactive");
    }

    try {
      const [created] = await this.authRepository.createDispatcher({
        fullName: dto.fullName.trim(),
        phoneNumber: dto.phoneNumber.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(dto.password),
        providerId,
      });

      if (!created) {
        throw new ConflictException("Failed to create dispatcher account");
      }

      if (dto.inviteToken) {
        const hashedToken = this.inviteTokenHash(dto.inviteToken.trim());
        const [invite] = await this.authRepository.findActiveInviteByTokenHash(hashedToken);
        if (invite) {
          await this.authRepository.markInviteAsUsed(invite.id);
        }
      }

      const user = this.mapDbUserToAuthUser(created);
      const token = signAuthToken(user);

      return {
        accessToken: token.accessToken,
        expiresInSeconds: token.expiresInSeconds,
        user,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code ?? "")
          : "";
      if (
        code === "23505" ||
        message.includes("email_unique") ||
        message.includes("phone_unique") ||
        message.includes("duplicate key")
      ) {
        throw new ConflictException("Email or phone number is already in use");
      }
      throw error;
    }
  }

  async me(userId: string) {
    const [dispatcher] = await this.authRepository.findDispatcherById(userId);
    if (!dispatcher || !dispatcher.isActive) {
      throw new UnauthorizedException("Invalid session");
    }

    return {
      user: this.mapDbUserToAuthUser(dispatcher),
    };
  }

  async createDispatcherInvite(dto: DispatcherInviteCreateDto, actor: AuthUser) {
    if (!actor.providerId) {
      throw new BadRequestException("Dispatcher is not attached to a provider");
    }

    const inviteToken = randomBytes(24).toString("hex");
    const tokenHash = this.inviteTokenHash(inviteToken);
    const expiresAt = new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000);

    const [invite] = await this.authRepository.createDispatcherInvite({
      providerId: actor.providerId,
      createdByUserId: actor.id,
      tokenHash,
      invitedEmail: dto.email?.trim().toLowerCase(),
      expiresAt,
    });

    if (!invite) {
      throw new BadRequestException("Failed to create invite");
    }

    return {
      ...invite,
      inviteToken,
    };
  }
}
