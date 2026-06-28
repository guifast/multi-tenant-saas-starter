import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../common/auth/auth.guard";
import { CsrfGuard } from "../common/auth/csrf.guard";
import { PermissionGuard } from "../common/auth/permission.guard";
import { TenantGuard } from "../common/tenancy/tenant.guard";
import { MembershipsService } from "./memberships.service";

@UseGuards(AuthGuard, CsrfGuard, TenantGuard)
@Controller("tenants/:slug/members")
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @UseGuards(new PermissionGuard("member:read"))
  @Get()
  list(@Req() request: Request) {
    return this.memberships.list(request.tenant!.id);
  }

  @UseGuards(new PermissionGuard("member:update"))
  @Patch(":membershipId")
  update(
    @Req() request: Request,
    @Param("membershipId") membershipId: string,
    @Body() body: unknown,
  ) {
    return this.memberships.updateRole(
      request.tenant!.id,
      membershipId,
      request.user!.id,
      body,
    );
  }

  @UseGuards(new PermissionGuard("member:remove"))
  @Delete(":membershipId")
  remove(@Req() request: Request, @Param("membershipId") membershipId: string) {
    return this.memberships.remove(request.tenant!.id, membershipId, request.user!.id);
  }
}
