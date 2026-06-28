import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AppError } from "../errors/app-error";
import type { TenantContext } from "../auth/request-user";

@Injectable()
export class TenantContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string, slug: string): Promise<TenantContext> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, tenant: { slug } },
      include: { tenant: true },
    });
    if (!membership) {
      throw new AppError("TENANT_NOT_FOUND", "Workspace not found.", 404);
    }
    return {
      id: membership.tenantId,
      slug: membership.tenant.slug,
      name: membership.tenant.name,
      membershipId: membership.id,
      role: membership.role,
    };
  }
}
