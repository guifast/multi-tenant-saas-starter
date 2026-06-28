import { Injectable } from "@nestjs/common";
import { Role } from "@saas/database";
import { updateMembershipSchema } from "@saas/contracts";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../common/errors/app-error";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string) {
    const data = await this.prisma.membership.findMany({
      where: { tenantId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return { data };
  }

  async updateRole(
    tenantId: string,
    membershipId: string,
    actorUserId: string,
    input: unknown,
  ) {
    const data = updateMembershipSchema.parse(input);
    const membership = await this.findMembership(tenantId, membershipId);
    if (membership.role === Role.OWNER && data.role !== Role.OWNER) {
      await this.assertAnotherOwnerExists(tenantId, membershipId);
    }
    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: data.role },
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: "member.role_changed",
      entityType: "membership",
      entityId: membershipId,
      metadata: { role: data.role },
    });
    return { data: updated };
  }

  async remove(tenantId: string, membershipId: string, actorUserId: string) {
    const membership = await this.findMembership(tenantId, membershipId);
    if (membership.role === Role.OWNER) {
      await this.assertAnotherOwnerExists(tenantId, membershipId);
    }
    await this.prisma.membership.delete({ where: { id: membershipId } });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: "member.removed",
      entityType: "membership",
      entityId: membershipId,
    });
    return { data: { ok: true } };
  }

  private async findMembership(tenantId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, tenantId },
    });
    if (!membership) throw new AppError("MEMBER_NOT_FOUND", "Member not found.", 404);
    return membership;
  }

  private async assertAnotherOwnerExists(tenantId: string, membershipId: string) {
    const owners = await this.prisma.membership.count({
      where: { tenantId, role: "OWNER", id: { not: membershipId } },
    });
    if (owners < 1) {
      throw new AppError(
        "FINAL_OWNER_REQUIRED",
        "A workspace must keep at least one owner.",
        409,
      );
    }
  }
}
