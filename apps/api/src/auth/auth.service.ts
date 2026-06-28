import bcrypt from "bcryptjs";
import type { Response } from "express";
import { Injectable } from "@nestjs/common";
import { loginSchema, registerSchema } from "@saas/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import { AppError } from "../common/errors/app-error";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  createOpaqueToken,
  hashToken,
} from "../common/auth/session";

const SESSION_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: unknown, response: Response) {
    const data = registerSchema.parse(input);
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      throw new AppError("EMAIL_ALREADY_REGISTERED", "Unable to create account.", 409);
    }

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
      },
      select: { id: true, name: true, email: true },
    });
    await this.createSession(user.id, response);
    return { data: { user } };
  }

  async login(input: unknown, response: Response) {
    const data = loginSchema.parse(input);
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    const valid = user ? await bcrypt.compare(data.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }
    await this.createSession(user.id, response);
    return { data: { user: { id: user.id, name: user.name, email: user.email } } };
  }

  async logout(sessionToken: string | undefined, response: Response) {
    if (sessionToken) {
      await this.prisma.session.deleteMany({
        where: { tokenHash: hashToken(sessionToken) },
      });
    }
    this.clearCookies(response);
    return { data: { ok: true } };
  }

  async me(userId: string | undefined) {
    if (!userId) return { data: { user: null } };
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    return { data: { user } };
  }

  private async createSession(userId: string, response: Response) {
    const sessionToken = createOpaqueToken();
    const csrfToken = createOpaqueToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: { userId, tokenHash: hashToken(sessionToken), expiresAt },
    });
    const secure = process.env.NODE_ENV === "production";
    response.cookie(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      expires: expiresAt,
      path: "/",
    });
    response.cookie(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      sameSite: "lax",
      secure,
      expires: expiresAt,
      path: "/",
    });
  }

  private clearCookies(response: Response) {
    response.clearCookie(SESSION_COOKIE, { path: "/" });
    response.clearCookie(CSRF_COOKIE, { path: "/" });
  }
}
