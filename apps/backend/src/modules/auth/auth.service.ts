import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import type {
  DispatcherBootstrapSignupDto,
  DispatcherInviteCreateDto,
  DispatcherInviteLoginDto,
  DispatcherLoginDto,
  DispatcherSignupDto,
  StaffInviteActivateDto,
  StaffInviteCreateDto,
  StaffLoginDto,
  StaffRoleDto,
  StaffSignupDto,
} from "@/common/validation/schemas";
import { hashPassword, verifyPassword } from "@/common/auth/password-hasher";
import { signAuthToken } from "@/common/auth/auth-token";
import type { AuthUser } from "@/common/auth/auth.types";
import { AuthRepository } from "./auth.repository";
import type { StaffInviteRole, UserRole } from "@/core/database/schema";

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
    role: UserRole;
    providerId: string | null;
    isDispatcherAdmin?: boolean;
  }): AuthUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      providerId: user.providerId,
      isDispatcherAdmin: user.isDispatcherAdmin ?? false,
    };
  }

  private ensureStaffRole(role: StaffRoleDto): Exclude<UserRole, "PATIENT"> {
    return role;
  }

  private handleUniqueConstraint(error: unknown) {
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

  async loginStaff(dto: StaffLoginDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const role = this.ensureStaffRole(dto.role);
    const [staff] = await this.authRepository.findStaffByEmailAndRole(normalizedEmail, role);

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!verifyPassword(dto.password, staff.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = this.mapDbUserToAuthUser(staff);
    const token = signAuthToken(user);
    await this.authRepository.touchLastLogin(user.id);

    return {
      accessToken: token.accessToken,
      expiresInSeconds: token.expiresInSeconds,
      user,
    };
  }

  async signupStaff(dto: StaffSignupDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const inviteToken = dto.inviteToken?.trim();
    if (!inviteToken) {
      throw new BadRequestException("Invite token is required");
    }

    const requestedRole = this.ensureStaffRole(dto.role);
    let effectiveRole: Exclude<UserRole, "PATIENT"> = requestedRole;
    let inviteIdToConsume: string | null = null;

    const hashedToken = this.inviteTokenHash(inviteToken);
    const [invite] = await this.authRepository.findActiveStaffInviteByTokenHash(hashedToken);
    if (!invite) {
      throw new BadRequestException("Invalid or expired invite token");
    }

    if (invite.invitedEmail && invite.invitedEmail.toLowerCase() !== normalizedEmail) {
      throw new BadRequestException("Invite is issued for a different email address");
    }

    const providerId = invite.providerId;
    effectiveRole = invite.role as Exclude<UserRole, "PATIENT">;
    inviteIdToConsume = invite.id;

    if (requestedRole !== effectiveRole) {
      throw new BadRequestException("Invite role does not match selected role");
    }

    const [provider] = await this.authRepository.findProviderById(providerId);
    if (!provider || !provider.isActive) {
      throw new NotFoundException("Provider not found or inactive");
    }

    try {
      const [created] = await this.authRepository.createStaff({
        role: effectiveRole,
        fullName: dto.fullName.trim(),
        phoneNumber: dto.phoneNumber.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(dto.password),
        providerId,
        isDispatcherAdmin: false,
      });

      if (!created) {
        throw new ConflictException("Failed to create staff account");
      }

      if (inviteIdToConsume) {
        await this.authRepository.markStaffInviteAsUsed(inviteIdToConsume);
      }

      const user = this.mapDbUserToAuthUser(created);
      const token = signAuthToken(user);

      return {
        accessToken: token.accessToken,
        expiresInSeconds: token.expiresInSeconds,
        user,
      };
    } catch (error) {
      this.handleUniqueConstraint(error);
    }
  }

  async loginDispatcher(dto: DispatcherLoginDto) {
    return this.loginStaff({
      role: "DISPATCHER",
      email: dto.email,
      password: dto.password,
    });
  }

  async signupDispatcher(dto: DispatcherSignupDto) {
    return this.signupStaff({
      role: "DISPATCHER",
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      password: dto.password,
      inviteToken: dto.inviteToken,
    });
  }

  async bootstrapDispatcherSignup(dto: DispatcherBootstrapSignupDto) {
    const normalizedEmail = this.normalizeEmail(dto.email);
    const initialPrice = dto.initialPrice === undefined ? undefined : dto.initialPrice.toFixed(2);
    const pricePerKm = dto.pricePerKm === undefined ? undefined : dto.pricePerKm.toFixed(2);

    try {
      const created = await this.authRepository.createProviderWithAdminDispatcher({
        provider: {
          name: dto.providerName.trim(),
          providerType: dto.providerType,
          hotlineNumber: dto.hotlineNumber?.trim() || undefined,
          address: dto.address?.trim() || undefined,
          initialPrice,
          pricePerKm,
        },
        dispatcher: {
          fullName: dto.fullName.trim(),
          phoneNumber: dto.phoneNumber.trim(),
          email: normalizedEmail,
          passwordHash: hashPassword(dto.password),
        },
      });

      const user = this.mapDbUserToAuthUser(created);
      const token = signAuthToken(user);
      await this.authRepository.touchLastLogin(user.id);

      return {
        accessToken: token.accessToken,
        expiresInSeconds: token.expiresInSeconds,
        user,
      };
    } catch (error) {
      this.handleUniqueConstraint(error);
    }
  }

  async me(userId: string) {
    const [staff] = await this.authRepository.findStaffById(userId);
    if (!staff || !staff.isActive || staff.role === "PATIENT") {
      throw new UnauthorizedException("Invalid session");
    }

    return {
      user: this.mapDbUserToAuthUser(staff),
    };
  }

  async createStaffInvite(dto: StaffInviteCreateDto, actor: AuthUser) {
    if (!actor.providerId) {
      throw new BadRequestException("Dispatcher is not attached to a provider");
    }
    if (actor.role === "DISPATCHER" && !actor.isDispatcherAdmin) {
      throw new ForbiddenException("Only dispatcher admins can create staff invites");
    }
    if (!dto.email?.trim()) {
      throw new BadRequestException("Email is required for staff invite links");
    }

    const inviteToken = randomBytes(24).toString("hex");
    const tokenHash = this.inviteTokenHash(inviteToken);
    const codeHash = hashPassword(randomBytes(24).toString("hex"));
    const expiresAt = new Date(Date.now() + dto.expiresInHours * 60 * 60 * 1000);

    const [invite] = await this.authRepository.createStaffInvite({
      providerId: actor.providerId,
      role: dto.role as StaffInviteRole,
      createdByUserId: actor.id,
      codeHash,
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

  async createDispatcherInvite(dto: DispatcherInviteCreateDto, actor: AuthUser) {
    return this.createStaffInvite(
      {
        role: "DISPATCHER",
        email: dto.email,
        expiresInHours: dto.expiresInHours,
      },
      actor
    );
  }

  async previewStaffInvite(inviteToken: string) {
    const hashedToken = this.inviteTokenHash(inviteToken.trim());
    const [invite] = await this.authRepository.findActiveStaffInviteByTokenHash(hashedToken);
    if (!invite) {
      return {
        valid: false,
        role: null,
        invitedEmail: null,
        expiresAt: null,
      };
    }

    return {
      valid: true,
      role: invite.role,
      invitedEmail: invite.invitedEmail,
      expiresAt: invite.expiresAt,
    };
  }

  async activateStaffInvite(dto: StaffInviteActivateDto) {
    const hashedToken = this.inviteTokenHash(dto.inviteToken.trim());
    const [invite] = await this.authRepository.findActiveStaffInviteByTokenHash(hashedToken);
    if (!invite) {
      throw new BadRequestException("Invalid or expired invite token");
    }

    const invitedEmail = invite.invitedEmail?.trim().toLowerCase();
    if (!invitedEmail) {
      throw new BadRequestException("Invite is missing invited email");
    }

    const [provider] = await this.authRepository.findProviderById(invite.providerId);
    if (!provider || !provider.isActive) {
      throw new NotFoundException("Provider not found or inactive");
    }

    const role = invite.role as Exclude<UserRole, "PATIENT">;
    const passwordHash = hashPassword(dto.password);

    let [staff] = await this.authRepository.findStaffByEmailAndRole(invitedEmail, role);

    if (staff && staff.providerId !== invite.providerId) {
      throw new ConflictException("Account already exists under a different provider");
    }

    if (staff && staff.isActive) {
      throw new ConflictException("Account is already active for this invite");
    }

    if (!staff) {
      const [created] = await this.authRepository.createStaff({
        role,
        fullName: null,
        phoneNumber: null,
        email: invitedEmail,
        passwordHash,
        providerId: invite.providerId,
        isDispatcherAdmin: false,
      });
      if (!created) {
        throw new ConflictException("Failed to create account from invite");
      }
      staff = {
        ...created,
        passwordHash,
        phoneNumber: null,
        isActive: true,
      };
    } else {
      await this.authRepository.updateStaffPasswordAndActive(staff.id, passwordHash, true);
      staff.passwordHash = passwordHash;
      staff.isActive = true;
    }

    await this.authRepository.markStaffInviteAsUsed(invite.id);

    const user = this.mapDbUserToAuthUser(staff);
    const token = signAuthToken(user);
    await this.authRepository.touchLastLogin(user.id);

    return {
      accessToken: token.accessToken,
      expiresInSeconds: token.expiresInSeconds,
      user,
    };
  }

  async loginDispatcherWithInvite(dto: DispatcherInviteLoginDto) {
    throw new BadRequestException(
      "Dispatcher invite-login is deprecated. Use invite activation with password confirmation."
    );
  }
}
