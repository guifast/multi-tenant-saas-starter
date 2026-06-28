import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../common/auth/auth.guard";
import { CsrfGuard } from "../common/auth/csrf.guard";
import { PermissionGuard } from "../common/auth/permission.guard";
import { TenantGuard } from "../common/tenancy/tenant.guard";
import { TenantsService } from "./tenants.service";

@UseGuards(AuthGuard, CsrfGuard)
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Post()
  create(@Req() request: Request, @Body() body: unknown) {
    return this.tenants.create(request.user!.id, body);
  }

  @Get()
  list(@Req() request: Request) {
    return this.tenants.list(request.user!.id);
  }

  @Get(":slug")
  get(@Req() request: Request, @Param("slug") slug: string) {
    return this.tenants.get(request.user!.id, slug);
  }

  @UseGuards(TenantGuard, new PermissionGuard("tenant:update"))
  @Patch(":slug")
  update(@Req() request: Request, @Body() body: unknown) {
    return this.tenants.update(request.tenant!.id, request.user!.id, body);
  }
}
