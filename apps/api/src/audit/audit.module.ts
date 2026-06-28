import { Module } from "@nestjs/common";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";
import { TenantContextService } from "../common/tenancy/tenant-context.service";

@Module({
  controllers: [AuditController],
  providers: [AuditService, TenantContextService],
  exports: [AuditService],
})
export class AuditModule {}
