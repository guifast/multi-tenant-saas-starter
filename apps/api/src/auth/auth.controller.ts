import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthGuard } from "../common/auth/auth.guard";
import { CsrfGuard } from "../common/auth/csrf.guard";
import { SESSION_COOKIE } from "../common/auth/session";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  register(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    return this.auth.register(body, response);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    return this.auth.login(body, response);
  }

  @UseGuards(CsrfGuard)
  @Post("logout")
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    return this.auth.logout(token, response);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  me(@Req() request: Request) {
    return this.auth.me(request.user?.id);
  }
}
