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

  private normalizeOptional(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
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

  private buildSessionResponse(user: AuthUser) {
    const token = signAuthToken(user);
    return {
      accessToken: token.accessToken,
      expiresInSeconds: token.expiresInSeconds,
      user,
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
    await this.authRepository.touchLastLogin(user.id);
    return this.buildSessionResponse(user);
  }

  async signupStaff(dto: StaffSignupDto) {
    const inviteToken = this.normalizeOptional(dto.inviteToken);
    if (!inviteToken) {
      throw new BadRequestException("Invite token is required");
    }
    return this.activateInviteFlow({
      inviteToken,
      password: dto.password,
      expectedRole: this.ensureStaffRole(dto.role),
      expectedEmail: this.normalizeEmail(dto.email),
      profile: {
        fullName: this.normalizeOptional(dto.fullName),
        phoneNumber: this.normalizeOptional(dto.phoneNumber),
      },
    });
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
    const normalizedPhoneNumber = dto.phoneNumber.trim();
    const initialPrice = dto.initialPrice === undefined ? undefined : dto.initialPrice.toFixed(2);
    const pricePerKm = dto.pricePerKm === undefined ? undefined : dto.pricePerKm.toFixed(2);

    const existingUsers = await this.authRepository.findUserByEmailOrPhone(
      normalizedEmail,
      normalizedPhoneNumber
    );
    const emailExists = existingUsers.some((user) => user.email === normalizedEmail);
    const phoneExists = existingUsers.some((user) => user.phoneNumber === normalizedPhoneNumber);

    if (emailExists && phoneExists) {
      throw new ConflictException("Email and phone number are already in use");
    }
    if (emailExists) {
      throw new ConflictException("Email is already in use");
    }
    if (phoneExists) {
      throw new ConflictException("Phone number is already in use");
    }

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
          phoneNumber: normalizedPhoneNumber,
          email: normalizedEmail,
          passwordHash: hashPassword(dto.password),
        },
      });

      const user = this.mapDbUserToAuthUser(created);
      await this.authRepository.touchLastLogin(user.id);
      return this.buildSessionResponse(user);
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
    const normalizedEmail = this.normalizeEmail(dto.email);
    const normalizedPhoneNumber = this.normalizeOptional(dto.phoneNumber);
    const existingUsers = await this.authRepository.findUserByEmailOrPhone(
      normalizedEmail,
      normalizedPhoneNumber ?? undefined
    );
    const emailExists = existingUsers.some((user) => user.email === normalizedEmail);
    const phoneExists =
      normalizedPhoneNumber !== null &&
      existingUsers.some((user) => user.phoneNumber === normalizedPhoneNumber);

    if (emailExists && phoneExists) {
      throw new ConflictException("Email and phone number are already in use");
    }
    if (emailExists) {
      throw new ConflictException("Email is already in use");
    }
    if (phoneExists) {
      throw new ConflictException("Phone number is already in use");
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
      fullName: dto.fullName?.trim() || undefined,
      phoneNumber: normalizedPhoneNumber ?? undefined,
      invitedEmail: normalizedEmail,
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
    const inviteToken = this.normalizeOptional(dto.inviteToken);
    if (!inviteToken) {
      throw new BadRequestException("Invite token is required");
    }
    return this.activateInviteFlow({
      inviteToken,
      password: dto.password,
    });
  }

  private async activateInviteFlow(input: {
    inviteToken: string;
    password: string;
    expectedRole?: Exclude<UserRole, "PATIENT">;
    expectedEmail?: string;
    profile?: {
      fullName?: string | null;
      phoneNumber?: string | null;
    };
  }) {
    const hashedToken = this.inviteTokenHash(input.inviteToken);
    const [invite] = await this.authRepository.findActiveStaffInviteByTokenHash(hashedToken);
    if (!invite) {
      throw new BadRequestException("Invalid or expired invite token");
    }

    const invitedEmail = this.normalizeOptional(invite.invitedEmail)?.toLowerCase() ?? null;
    if (!invitedEmail) {
      throw new BadRequestException("Invite is missing invited email");
    }
    if (input.expectedEmail && invitedEmail !== input.expectedEmail) {
      throw new BadRequestException("Invite is issued for a different email address");
    }

    const [provider] = await this.authRepository.findProviderById(invite.providerId);
    if (!provider || !provider.isActive) {
      throw new NotFoundException("Provider not found or inactive");
    }

    const role = invite.role as Exclude<UserRole, "PATIENT">;
    if (input.expectedRole && input.expectedRole !== role) {
      throw new BadRequestException("Invite role does not match selected role");
    }

    const fullNameFromInvite =
      this.normalizeOptional(invite.fullName) ?? this.normalizeOptional(input.profile?.fullName);
    const phoneFromInvite =
      this.normalizeOptional(invite.phoneNumber) ?? this.normalizeOptional(input.profile?.phoneNumber);
    const passwordHash = hashPassword(input.password);

    let [staff] = await this.authRepository.findStaffByEmailAndRole(invitedEmail, role);

    if (staff && staff.providerId !== invite.providerId) {
      throw new ConflictException("Account already exists under a different provider");
    }

    if (staff && staff.isActive) {
      throw new ConflictException("Account is already active for this invite");
    }

    if (!staff) {
      try {
        const [created] = await this.authRepository.createStaff({
          role,
          fullName: fullNameFromInvite,
          phoneNumber: phoneFromInvite,
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
          phoneNumber: phoneFromInvite,
          isActive: true,
        };
      } catch (error) {
        this.handleUniqueConstraint(error);
      }
    } else {
      try {
        await this.authRepository.updateStaffPasswordAndActive(
          staff.id,
          passwordHash,
          true,
          staff.fullName ? undefined : (fullNameFromInvite ?? undefined),
          staff.phoneNumber ? undefined : (phoneFromInvite ?? undefined)
        );
      } catch (error) {
        this.handleUniqueConstraint(error);
      }
      staff.passwordHash = passwordHash;
      staff.isActive = true;
      if (!staff.fullName && fullNameFromInvite) {
        staff.fullName = fullNameFromInvite;
      }
      if (!staff.phoneNumber && phoneFromInvite) {
        staff.phoneNumber = phoneFromInvite;
      }
    }

    await this.authRepository.markStaffInviteAsUsed(invite.id);

    const user = this.mapDbUserToAuthUser(staff);
    await this.authRepository.touchLastLogin(user.id);
    return this.buildSessionResponse(user);
  }
}
