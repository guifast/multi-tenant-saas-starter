import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TenantContextService } from "../common/tenancy/tenant-context.service";
import { TenantsController } from "./tenants.controller";
import { TenantsService } from "./tenants.service";

@Module({
  imports: [AuditModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantContextService],
  exports: [TenantsService],
})
export class TenantsModule {}
