import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppError } from "../errors/app-error";
import { TenantContextService } from "./tenant-context.service";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
    }
    const rawSlug = request.params["slug"];
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    if (!slug) {
      throw new AppError("TENANT_SLUG_REQUIRED", "Workspace slug is required.", 400);
    }
    request.tenant = await this.tenantContext.resolve(request.user.id, slug);
    return true;
  }
}
