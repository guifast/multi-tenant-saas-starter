import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TenantContextService } from "../common/tenancy/tenant-context.service";
import { MembershipsController } from "./memberships.controller";
import { MembershipsService } from "./memberships.service";

@Module({
  imports: [AuditModule],
  controllers: [MembershipsController],
  providers: [MembershipsService, TenantContextService],
})
export class MembershipsModule {}
