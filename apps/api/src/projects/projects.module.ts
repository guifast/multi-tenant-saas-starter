import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TenantContextService } from "../common/tenancy/tenant-context.service";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [AuditModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, TenantContextService],
})
export class ProjectsModule {}
