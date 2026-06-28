import type { Role } from "@saas/database";

export type Permission =
  | "tenant:update"
  | "member:invite"
  | "member:read"
  | "member:update"
  | "member:remove"
  | "invitation:revoke"
  | "project:read"
  | "project:create"
  | "project:update"
  | "project:archive"
  | "audit:read";

const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    "tenant:update",
    "member:invite",
    "member:read",
    "member:update",
    "member:remove",
    "invitation:revoke",
    "project:read",
    "project:create",
    "project:update",
    "project:archive",
    "audit:read",
  ],
  ADMIN: [
    "member:invite",
    "member:read",
    "project:read",
    "project:create",
    "project:update",
    "project:archive",
    "audit:read",
  ],
  MEMBER: ["project:read", "project:create", "project:update"],
  VIEWER: ["project:read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canInvite(inviterRole: Role, invitedRole: Role): boolean {
  if (inviterRole === "OWNER") return invitedRole !== "OWNER";
  if (inviterRole === "ADMIN")
    return invitedRole === "MEMBER" || invitedRole === "VIEWER";
  return false;
}
