import { Injectable } from "@nestjs/common";
import { Prisma } from "@saas/database";
import {
  createProjectSchema,
  paginationSchema,
  updateProjectSchema,
} from "@saas/contracts";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../common/errors/app-error";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, actorUserId: string, input: unknown) {
    const data = createProjectSchema.parse(input);
    if (data.assignedToId) {
      await this.assertMemberInTenant(tenantId, data.assignedToId);
    }
    const createData: Prisma.ProjectUncheckedCreateInput = {
      tenantId,
      name: data.name,
      status: data.status,
      createdById: actorUserId,
    };
    if (data.description !== undefined) createData.description = data.description;
    if (data.assignedToId !== undefined) createData.assignedToId = data.assignedToId;

    const project = await this.prisma.project.create({ data: createData });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: "project.created",
      entityType: "project",
      entityId: project.id,
    });
    return { data: project };
  }

  async list(tenantId: string, query: unknown) {
    const { page, pageSize } = paginationSchema.parse(query);
    const where = { tenantId };
    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);
    return { data: items, meta: { page, pageSize, total } };
  }

  async get(tenantId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
    });
    if (!project) throw new AppError("PROJECT_NOT_FOUND", "Project not found.", 404);
    return { data: project };
  }

  async update(tenantId: string, projectId: string, actorUserId: string, input: unknown) {
    const data = updateProjectSchema.parse(input);
    if (data.assignedToId) {
      await this.assertMemberInTenant(tenantId, data.assignedToId);
    }
    const updateData: Prisma.ProjectUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;

    const result = await this.prisma.project.updateMany({
      where: { id: projectId, tenantId },
      data: updateData,
    });
    if (result.count === 0) {
      throw new AppError("PROJECT_NOT_FOUND", "Project not found.", 404);
    }
    const project = await this.prisma.project.findFirstOrThrow({
      where: { id: projectId, tenantId },
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: "project.updated",
      entityType: "project",
      entityId: projectId,
    });
    return { data: project };
  }

  async archive(tenantId: string, projectId: string, actorUserId: string) {
    const result = await this.prisma.project.updateMany({
      where: { id: projectId, tenantId },
      data: { status: "ARCHIVED" },
    });
    if (result.count === 0) {
      throw new AppError("PROJECT_NOT_FOUND", "Project not found.", 404);
    }
    const project = await this.prisma.project.findFirstOrThrow({
      where: { id: projectId, tenantId },
    });
    await this.audit.record({
      tenantId,
      actorUserId,
      action: "project.archived",
      entityType: "project",
      entityId: projectId,
    });
    return { data: project };
  }

  private async assertMemberInTenant(tenantId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
    if (!membership) {
      throw new AppError(
        "ASSIGNEE_NOT_IN_TENANT",
        "Assignee must belong to the workspace.",
        400,
      );
    }
  }
}
