import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../common/auth/auth.guard";
import { CsrfGuard } from "../common/auth/csrf.guard";
import { PermissionGuard } from "../common/auth/permission.guard";
import { TenantGuard } from "../common/tenancy/tenant.guard";
import { InvitationsService } from "./invitations.service";

@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @UseGuards(AuthGuard, CsrfGuard, TenantGuard, new PermissionGuard("member:invite"))
  @Post("tenants/:slug/invitations")
  create(@Req() request: Request, @Body() body: unknown) {
    return this.invitations.create(request.tenant!, request.user!.id, body);
  }

  @UseGuards(AuthGuard, TenantGuard, new PermissionGuard("member:invite"))
  @Get("tenants/:slug/invitations")
  list(@Req() request: Request) {
    return this.invitations.list(request.tenant!.id);
  }

  @UseGuards(AuthGuard, CsrfGuard, TenantGuard, new PermissionGuard("invitation:revoke"))
  @Delete("tenants/:slug/invitations/:invitationId")
  revoke(@Req() request: Request, @Param("invitationId") invitationId: string) {
    return this.invitations.revoke(request.tenant!.id, invitationId, request.user!.id);
  }

  @UseGuards(AuthGuard, CsrfGuard)
  @Post("invitations/:token/accept")
  accept(@Req() request: Request, @Param("token") token: string) {
    return this.invitations.accept(token, request.user!.id);
  }
}
