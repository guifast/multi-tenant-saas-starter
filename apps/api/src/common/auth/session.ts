import crypto from "node:crypto";
import { nanoid } from "nanoid";

export const SESSION_COOKIE = "sid";
export const CSRF_COOKIE = "csrf";

export function createOpaqueToken() {
  return nanoid(48);
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
