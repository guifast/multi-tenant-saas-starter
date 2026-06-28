# 0001: Session Auth and Tenant Scope

## Status

Accepted

## Context

This starter targets browser-based SaaS products. The default path should be secure enough for a real product without requiring external identity providers during local development.

## Decision

Use opaque server-side sessions stored as hashes, an HttpOnly session cookie and a readable CSRF cookie for mutation protection.

Resolve tenant context from authenticated membership and route slug. Pass trusted tenant ids into services instead of accepting tenant ids from request bodies.

## Consequences

- Local development works without third-party auth.
- Session revocation is a database delete.
- API clients outside the browser can still authenticate if they handle cookies and CSRF intentionally.
- Tenant isolation remains visible in service code and tests.
