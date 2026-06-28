import { Injectable } from "@nestjs/common";
import { Prisma } from "@saas/database";
import { createTenantSchema, normalizeSlug, updateTenantSchema } from "@saas/contracts";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../common/errors/app-error";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, input: unknown) {
    const data = createTenantSchema.parse(input);
    const slug = data.slug ?? normalizeSlug(data.name);
    if (!slug) throw new AppError("INVALID_SLUG", "Workspace slug is invalid.", 400);

    const tenant = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: { name: data.name, slug, createdById: userId },
      });
      await tx.membership.create({
        data: { userId, tenantId: created.id, role: "OWNER" },
      });
      return created;
    });

    await this.audit.record({
      tenantId: tenant.id,
      actorUserId: userId,
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenant.id,
    });

    return { data: tenant };
  }

  async list(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { tenant: true },
      orderBy: { createdAt: "asc" },
    });
    return { data: memberships.map(({ tenant, role }) => ({ ...tenant, role })) };
  }

  async get(userId: string, slug: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, tenant: { slug } },
      include: { tenant: true },
    });
    if (!membership) throw new AppError("TENANT_NOT_FOUND", "Workspace not found.", 404);
    return { data: { ...membership.tenant, role: membership.role } };
  }

  async update(tenantId: string, actorUserId: string, input: unknown) {
    const data = updateTenantSchema.parse(input);
    const updateData: Prisma.TenantUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: "tenant.updated",
      entityType: "tenant",
      entityId: tenantId,
    });
    return { data: tenant };
  }
}
