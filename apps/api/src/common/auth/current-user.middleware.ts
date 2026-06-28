import type { NextFunction, Request, Response } from "express";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SESSION_COOKIE, hashToken } from "./session";

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) {
      next();
      return;
    }

    const session = await this.prisma.session.findFirst({
      where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (session) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };
    }
    next();
  }
}
