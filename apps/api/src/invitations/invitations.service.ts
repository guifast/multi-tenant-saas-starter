import { Injectable } from "@nestjs/common";
import { Invitation, Prisma } from "@saas/database";
import { inviteMemberSchema } from "@saas/contracts";
import { AuditService } from "../audit/audit.service";
import { canInvite } from "../common/auth/permissions";
import { createOpaqueToken, hashToken } from "../common/auth/session";
import type { TenantContext } from "../common/auth/request-user";
import { AppError } from "../common/errors/app-error";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(tenant: TenantContext, actorUserId: string, input: unknown) {
    const data = inviteMemberSchema.parse(input);
    if (!canInvite(tenant.role, data.role)) {
      throw new AppError("INVITE_ROLE_FORBIDDEN", "You cannot invite that role.", 403);
    }
    const token = createOpaqueToken();
    try {
      const invitation = await this.prisma.invitation.create({
        data: {
          tenantId: tenant.id,
          email: data.email,
          role: data.role,
          tokenHash: hashToken(token),
          invitedById: actorUserId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await this.audit.record({
        tenantId: tenant.id,
        actorUserId,
        action: "invitation.created",
        entityType: "invitation",
        entityId: invitation.id,
        metadata: { role: data.role, email: data.email },
      });
      return {
        data: {
          invitation: toPublicInvitation(invitation),
          developmentUrl: `/accept-invitation/${token}`,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AppError(
          "ACTIVE_INVITATION_EXISTS",
          "An active invitation already exists.",
          409,
        );
      }
      throw error;
    }
  }

  async list(tenantId: string) {
    return {
      data: (
        await this.prisma.invitation.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
        })
      ).map(toPublicInvitation),
    };
  }

  async revoke(tenantId: string, invitationId: string, actorUserId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, tenantId },
    });
    if (!invitation)
      throw new AppError("INVITATION_NOT_FOUND", "Invitation not found.", 404);
    if (invitation.acceptedAt) {
      throw new AppError(
        "INVITATION_ACCEPTED",
        "Accepted invitations cannot be revoked.",
        409,
      );
    }
    const result = await this.prisma.invitation.updateMany({
      where: { id: invitationId, tenantId },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) {
      throw new AppError("INVITATION_NOT_FOUND", "Invitation not found.", 404);
    }
    const revoked = await this.prisma.invitation.findFirstOrThrow({
      where: { id: invitationId, tenantId },
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: "invitation.revoked",
      entityType: "invitation",
      entityId: invitationId,
    });
    return { data: toPublicInvitation(revoked) };
  }

  async accept(token: string, userId: string) {
    const tokenHash = hashToken(token);
    const result = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({ where: { tokenHash } });
      if (!invitation)
        throw new AppError("INVITATION_NOT_FOUND", "Invitation not found.", 404);
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
      if (user.email !== invitation.email) {
        throw new AppError(
          "INVITATION_EMAIL_MISMATCH",
          "This invitation belongs to a different account.",
          403,
        );
      }
      if (invitation.revokedAt)
        throw new AppError("INVITATION_REVOKED", "Invitation revoked.", 410);
      if (invitation.expiresAt < new Date()) {
        throw new AppError("INVITATION_EXPIRED", "Invitation expired.", 410);
      }
      const existing = await tx.membership.findUnique({
        where: { userId_tenantId: { userId, tenantId: invitation.tenantId } },
      });
      if (invitation.acceptedAt && !existing) {
        throw new AppError(
          "INVITATION_ALREADY_ACCEPTED",
          "This invitation has already been accepted.",
          409,
        );
      }
      await tx.membership.upsert({
        where: { userId_tenantId: { userId, tenantId: invitation.tenantId } },
        update: {},
        create: {
          userId,
          tenantId: invitation.tenantId,
          role: invitation.role,
        },
      });
      const acceptedResult = await tx.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (acceptedResult.count === 1) {
        await tx.auditLog.create({
          data: {
            tenantId: invitation.tenantId,
            actorUserId: userId,
            action: "invitation.accepted",
            entityType: "invitation",
            entityId: invitation.id,
          },
        });
      }
      return tx.invitation.findUniqueOrThrow({ where: { id: invitation.id } });
    });
    return { data: toPublicInvitation(result) };
  }
}

function toPublicInvitation(invitation: Invitation) {
  const { tokenHash, ...publicInvitation } = invitation;
  void tokenHash;
  return publicInvitation;
}
