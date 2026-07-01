# Tenancy

Tenant context is resolved from:

1. authenticated session;
2. route workspace slug;
3. membership lookup.

The frontend never establishes ownership by sending a tenant id. Service methods receive trusted tenant context after `TenantGuard` resolves membership.

Tenant-owned operations include tenant scope:

- project reads, updates and archive operations;
- membership reads and role changes;
- invitation reads and revocation;
- audit-log reads.

Assignments are also scoped. A project assignee must have a membership in the same tenant.

Cross-tenant requests use safe `404` responses where revealing existence would leak information.

PostgreSQL RLS is not currently implemented. It is listed as a future defense-in-depth improvement.
