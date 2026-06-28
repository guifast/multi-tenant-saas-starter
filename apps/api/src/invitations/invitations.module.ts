import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TenantContextService } from "../common/tenancy/tenant-context.service";
import { InvitationsController } from "./invitations.controller";
import { InvitationsService } from "./invitations.service";

@Module({
  imports: [AuditModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, TenantContextService],
})
export class InvitationsModule {}
