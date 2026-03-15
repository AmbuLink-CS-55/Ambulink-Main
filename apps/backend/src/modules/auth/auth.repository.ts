import { Injectable } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";
import { DbService } from "@/core/database/db.service";
import { ambulanceProviders, dispatcherInvites, users } from "@/core/database/schema";

@Injectable()
export class AuthRepository {
  constructor(private readonly dbService: DbService) {}

  findDispatcherByEmail(email: string) {
    return this.dbService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        providerId: users.providerId,
        isActive: users.isActive,
      })
      .from(users)
      .where(and(eq(users.email, email), eq(users.role, "DISPATCHER")));
  }

  findDispatcherById(id: string) {
    return this.dbService.db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        providerId: users.providerId,
        isActive: users.isActive,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "DISPATCHER")));
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

  createDispatcher(input: {
    fullName?: string;
    phoneNumber?: string;
    email: string;
    passwordHash: string;
    providerId: string;
  }) {
    return this.dbService.db
      .insert(users)
      .values({
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        email: input.email,
        passwordHash: input.passwordHash,
        providerId: input.providerId,
        role: "DISPATCHER",
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        providerId: users.providerId,
      });
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

  createDispatcherInvite(input: {
    providerId: string;
    createdByUserId: string;
    tokenHash: string;
    invitedEmail?: string;
    expiresAt: Date;
  }) {
    return this.dbService.db
      .insert(dispatcherInvites)
      .values({
        providerId: input.providerId,
        createdByUserId: input.createdByUserId,
        tokenHash: input.tokenHash,
        invitedEmail: input.invitedEmail,
        expiresAt: input.expiresAt,
      })
      .returning({
        id: dispatcherInvites.id,
        providerId: dispatcherInvites.providerId,
        invitedEmail: dispatcherInvites.invitedEmail,
        expiresAt: dispatcherInvites.expiresAt,
      });
  }

  findActiveInviteByTokenHash(tokenHash: string) {
    return this.dbService.db
      .select({
        id: dispatcherInvites.id,
        providerId: dispatcherInvites.providerId,
        invitedEmail: dispatcherInvites.invitedEmail,
        expiresAt: dispatcherInvites.expiresAt,
        usedAt: dispatcherInvites.usedAt,
        revokedAt: dispatcherInvites.revokedAt,
      })
      .from(dispatcherInvites)
      .where(
        and(
          eq(dispatcherInvites.tokenHash, tokenHash),
          isNull(dispatcherInvites.usedAt),
          isNull(dispatcherInvites.revokedAt),
          gt(dispatcherInvites.expiresAt, new Date())
        )
      );
  }

  markInviteAsUsed(inviteId: string) {
    return this.dbService.db
      .update(dispatcherInvites)
      .set({
        usedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dispatcherInvites.id, inviteId));
  }
}
