import { describe, expect, it, vi } from "vitest";
import type { Project } from "@saas/database";
import type { AuditService } from "../audit/audit.service";
import type { PrismaService } from "../common/prisma/prisma.service";
import { ProjectsService } from "./projects.service";

const project: Project = {
  id: "5d94d42a-1507-4a0d-beb8-185d34c91c28",
  tenantId: "b9b8d944-d519-45fb-8636-44d5f528db35",
  name: "Scoped rollout",
  description: null,
  status: "ACTIVE",
  createdById: "d7cf2575-f828-4386-9fa9-2a46f7587dd8",
  assignedToId: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("ProjectsService", () => {
  it("loads a project by id and tenant id together", async () => {
    const findFirst = vi.fn().mockResolvedValue(project);
    const service = new ProjectsService(
      {
        project: {
          findFirst,
        },
      } as unknown as PrismaService,
      {} as AuditService,
    );

    await expect(service.get(project.tenantId, project.id)).resolves.toEqual({
      data: project,
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: project.id, tenantId: project.tenantId },
    });
  });
});
