import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../common/auth/auth.guard";
import { PermissionGuard } from "../common/auth/permission.guard";
import { TenantGuard } from "../common/tenancy/tenant.guard";
import { AuditService } from "./audit.service";

@UseGuards(AuthGuard, TenantGuard, new PermissionGuard("audit:read"))
@Controller("tenants/:slug/audit-logs")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Req() request: Request) {
    return this.audit.list(request.tenant!.id);
  }
}
