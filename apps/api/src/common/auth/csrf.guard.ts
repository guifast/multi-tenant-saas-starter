import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppError } from "../errors/app-error";
import { CSRF_COOKIE } from "./session";

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
    const cookie = request.cookies?.[CSRF_COOKIE] as string | undefined;
    const header = request.header("x-csrf-token");
    if (!cookie || !header || cookie !== header) {
      throw new AppError("CSRF_TOKEN_INVALID", "Invalid CSRF token.", 403);
    }
    return true;
  }
}
