import { describe, expect, it } from "vitest";
import { canInvite, hasPermission, type Permission } from "./permissions";

describe("permissions", () => {
  it("allows owners to manage the full workspace surface", () => {
    const permissions: Permission[] = [
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
    ];

    expect(permissions.every((permission) => hasPermission("OWNER", permission))).toBe(
      true,
    );
  });

  it("keeps viewers read-only inside projects", () => {
    expect(hasPermission("VIEWER", "project:read")).toBe(true);
    expect(hasPermission("VIEWER", "project:create")).toBe(false);
    expect(hasPermission("VIEWER", "member:invite")).toBe(false);
  });

  it("prevents privilege escalation through invitations", () => {
    expect(canInvite("OWNER", "ADMIN")).toBe(true);
    expect(canInvite("OWNER", "OWNER")).toBe(false);
    expect(canInvite("ADMIN", "MEMBER")).toBe(true);
    expect(canInvite("ADMIN", "ADMIN")).toBe(false);
    expect(canInvite("MEMBER", "VIEWER")).toBe(false);
  });
});
