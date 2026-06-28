import { Injectable } from "@nestjs/common";
import { Prisma } from "@saas/database";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    tenantId: string;
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    await this.prisma.auditLog.create({ data: input });
  }

  async list(tenantId: string) {
    return {
      data: await this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    };
  }
}
