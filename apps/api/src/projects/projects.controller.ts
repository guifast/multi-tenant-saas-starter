import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../common/auth/auth.guard";
import { CsrfGuard } from "../common/auth/csrf.guard";
import { PermissionGuard } from "../common/auth/permission.guard";
import { TenantGuard } from "../common/tenancy/tenant.guard";
import { ProjectsService } from "./projects.service";

@UseGuards(AuthGuard, CsrfGuard, TenantGuard)
@Controller("tenants/:slug/projects")
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @UseGuards(new PermissionGuard("project:create"))
  @Post()
  create(@Req() request: Request, @Body() body: unknown) {
    return this.projects.create(request.tenant!.id, request.user!.id, body);
  }

  @UseGuards(new PermissionGuard("project:read"))
  @Get()
  list(@Req() request: Request, @Query() query: unknown) {
    return this.projects.list(request.tenant!.id, query);
  }

  @UseGuards(new PermissionGuard("project:read"))
  @Get(":projectId")
  get(@Req() request: Request, @Param("projectId") projectId: string) {
    return this.projects.get(request.tenant!.id, projectId);
  }

  @UseGuards(new PermissionGuard("project:update"))
  @Patch(":projectId")
  update(
    @Req() request: Request,
    @Param("projectId") projectId: string,
    @Body() body: unknown,
  ) {
    return this.projects.update(request.tenant!.id, projectId, request.user!.id, body);
  }

  @UseGuards(new PermissionGuard("project:archive"))
  @Delete(":projectId")
  archive(@Req() request: Request, @Param("projectId") projectId: string) {
    return this.projects.archive(request.tenant!.id, projectId, request.user!.id);
  }
}
