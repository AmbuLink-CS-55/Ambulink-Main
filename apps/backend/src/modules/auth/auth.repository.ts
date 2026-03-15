import { Injectable } from "@nestjs/common";
import { and, count, eq, gt, isNull, ne } from "drizzle-orm";
import { DbService } from "@/core/database/db.service";
import { ambulanceProviders, staffInvites, users } from "@/core/database/schema";
import type { StaffInviteRole, UserRole } from "@/core/database/schema";

@Injectable()
export class AuthRepository {
  constructor(private readonly dbService: DbService) {}

  findStaffByEmailAndRole(email: string, role: Exclude<UserRole, "PATIENT">) {
    return this.dbService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        phoneNumber: users.phoneNumber,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        providerId: users.providerId,
        isDispatcherAdmin: users.isDispatcherAdmin,
        isActive: users.isActive,
      })
      .from(users)
      .where(and(eq(users.email, email), eq(users.role, role)));
  }

  findStaffById(id: string) {
    return this.dbService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        providerId: users.providerId,
        isDispatcherAdmin: users.isDispatcherAdmin,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, id));
  }

  findProviderById(providerId: string) {
    return this.dbService.db
      .select({
        id: ambulanceProviders.id,
        name: ambulanceProviders.name,
        isActive: ambulanceProviders.isActive,
      })
      .from(ambulanceProviders)
      .where(eq(ambulanceProviders.id, providerId));
  }

  createProviderWithAdminDispatcher(input: {
    provider: {
      name: string;
      providerType: "PUBLIC" | "PRIVATE";
      hotlineNumber?: string;
      address?: string;
      initialPrice?: string;
      pricePerKm?: string;
    };
    dispatcher: {
      fullName: string;
      phoneNumber: string;
      email: string;
      passwordHash: string;
    };
  }) {
    return this.dbService.db.transaction(async (tx) => {
      const [provider] = await tx
        .insert(ambulanceProviders)
        .values({
          name: input.provider.name,
          providerType: input.provider.providerType,
          hotlineNumber: input.provider.hotlineNumber ?? null,
          address: input.provider.address ?? null,
          initialPrice: input.provider.initialPrice ?? null,
          pricePerKm: input.provider.pricePerKm ?? null,
          isActive: true,
        })
        .returning({
          id: ambulanceProviders.id,
        });

      if (!provider) {
        throw new Error("Failed to create provider");
      }

      const [dispatcher] = await tx
        .insert(users)
        .values({
          fullName: input.dispatcher.fullName,
          phoneNumber: input.dispatcher.phoneNumber,
          email: input.dispatcher.email,
          passwordHash: input.dispatcher.passwordHash,
          providerId: provider.id,
          role: "DISPATCHER",
          isDispatcherAdmin: true,
        })
        .returning({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          providerId: users.providerId,
          isDispatcherAdmin: users.isDispatcherAdmin,
        });

      if (!dispatcher) {
        throw new Error("Failed to create bootstrap dispatcher");
      }

      return dispatcher;
    });
  }

  createStaff(input: {
    role: Exclude<UserRole, "PATIENT">;
    fullName: string | null;
    phoneNumber: string | null;
    email: string;
    passwordHash: string;
    providerId: string;
    isDispatcherAdmin?: boolean;
  }) {
    return this.dbService.db
      .insert(users)
      .values({
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        email: input.email,
        passwordHash: input.passwordHash,
        providerId: input.providerId,
        role: input.role,
        isDispatcherAdmin: input.isDispatcherAdmin ?? false,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        providerId: users.providerId,
        isDispatcherAdmin: users.isDispatcherAdmin,
      });
  }

  countDispatchersByProvider(providerId: string) {
    return this.dbService.db
      .select({ value: count() })
      .from(users)
      .where(
        and(eq(users.role, "DISPATCHER"), eq(users.providerId, providerId), eq(users.isActive, true))
      );
  }

  countActiveDispatcherAdmins(providerId: string, excludeUserId?: string) {
    const conditions = [
      eq(users.role, "DISPATCHER"),
      eq(users.providerId, providerId),
      eq(users.isActive, true),
      eq(users.isDispatcherAdmin, true),
    ];
    if (excludeUserId) {
      conditions.push(ne(users.id, excludeUserId));
    }

    return this.dbService.db
      .select({ value: count() })
      .from(users)
      .where(and(...conditions));
  }

  touchLastLogin(userId: string) {
    return this.dbService.db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  createStaffInvite(input: {
    providerId: string;
    role: StaffInviteRole;
    createdByUserId: string;
    codeHash: string;
    tokenHash: string;
    fullName?: string;
    invitedEmail?: string;
    expiresAt: Date;
  }) {
    return this.dbService.db
      .insert(staffInvites)
      .values({
        codeHash: input.codeHash,
        providerId: input.providerId,
        role: input.role,
        username:
          input.invitedEmail?.split("@")[0]?.trim() ||
          `invite-${input.createdByUserId.slice(0, 8)}`,
        fullName: input.fullName ?? null,
        email: input.invitedEmail,
        phoneNumber: null,
        createdByDispatcherId: input.createdByUserId,
        createdByUserId: input.createdByUserId,
        maxAttempts: 10,
        attemptsUsed: 0,
        tokenHash: input.tokenHash,
        invitedEmail: input.invitedEmail,
        expiresAt: input.expiresAt,
      })
      .returning({
        id: staffInvites.id,
        providerId: staffInvites.providerId,
        role: staffInvites.role,
        fullName: staffInvites.fullName,
        invitedEmail: staffInvites.invitedEmail,
        expiresAt: staffInvites.expiresAt,
      });
  }

  findActiveStaffInviteByTokenHash(tokenHash: string) {
    return this.dbService.db
      .select({
        id: staffInvites.id,
        providerId: staffInvites.providerId,
        role: staffInvites.role,
        fullName: staffInvites.fullName,
        invitedEmail: staffInvites.invitedEmail,
        codeHash: staffInvites.codeHash,
        expiresAt: staffInvites.expiresAt,
      })
      .from(staffInvites)
      .where(
        and(
          eq(staffInvites.tokenHash, tokenHash),
          isNull(staffInvites.usedAt),
          isNull(staffInvites.revokedAt),
          gt(staffInvites.expiresAt, new Date())
        )
      );
  }

  markStaffInviteAsUsed(inviteId: string) {
    return this.dbService.db
      .update(staffInvites)
      .set({
        usedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(staffInvites.id, inviteId));
  }

  updateStaffPassword(userId: string, passwordHash: string) {
    return this.dbService.db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  updateStaffPasswordAndActive(
    userId: string,
    passwordHash: string,
    active: boolean,
    fullName?: string
  ) {
    const updateData: Record<string, unknown> = {
      passwordHash,
      isActive: active,
      updatedAt: new Date(),
    };

    if (fullName !== undefined) {
      updateData.fullName = fullName;
    }

    return this.dbService.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
  }
}
