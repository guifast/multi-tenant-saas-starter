import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppError } from "../errors/app-error";
import { hasPermission, type Permission } from "./permissions";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly permission: Permission) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.tenant) {
      throw new AppError(
        "TENANT_CONTEXT_REQUIRED",
        "Workspace context is required.",
        500,
      );
    }
    if (!hasPermission(request.tenant.role, this.permission)) {
      throw new AppError("FORBIDDEN", "You do not have permission for this action.", 403);
    }
    return true;
  }
}
