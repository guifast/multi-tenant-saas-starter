# Authorization

Authorization is centralized around `PermissionGuard` and `hasPermission`.

| Action              | OWNER | ADMIN        | MEMBER | VIEWER |
| ------------------- | ----- | ------------ | ------ | ------ |
| View projects       | Yes   | Yes          | Yes    | Yes    |
| Create project      | Yes   | Yes          | Yes    | No     |
| Update project      | Yes   | Yes          | Yes    | No     |
| Archive project     | Yes   | Yes          | No     | No     |
| Invite members      | Yes   | Yes, limited | No     | No     |
| Revoke invitations  | Yes   | No           | No     | No     |
| View members        | Yes   | Yes          | No     | No     |
| Update member roles | Yes   | No           | No     | No     |
| Remove members      | Yes   | No           | No     | No     |
| View audit logs     | Yes   | Yes          | No     | No     |
| Update workspace    | Yes   | No           | No     | No     |

Final OWNER protection is enforced in the memberships service. A workspace cannot be left without an OWNER through role demotion or removal.
