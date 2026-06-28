# Architecture

## Overview

The starter is split into a web console, an API and shared packages. The API owns authentication, tenancy, authorization and persistence. The web app consumes the API with cookie-based sessions and CSRF headers.

```txt
Browser
  -> Next.js web app
  -> NestJS API
  -> Prisma Client
  -> PostgreSQL
```

## Tenancy

Tenant context is resolved by `TenantGuard` from the route slug and the authenticated user. Controllers never receive a raw tenant id from the client. Services receive a trusted `tenantId` after membership resolution.

Tenant-owned reads and writes include `tenantId` in their Prisma filters. This is the primary isolation boundary.

## Authorization

Roles are intentionally simple:

- OWNER: full workspace control
- ADMIN: member invite plus project operations
- MEMBER: project read/create/update
- VIEWER: project read only

Permission checks happen in `PermissionGuard` after authentication and tenant resolution.

## Authentication

The API creates an opaque session token, stores only its SHA-256 hash and sends the token in an HttpOnly cookie. A separate readable CSRF cookie is issued for browser requests.

## Audit Logs

Important tenant mutations create `AuditLog` rows with tenant, actor, action and entity metadata. Audit reads are tenant-scoped and permission-gated.

## Database

Prisma migrations define:

- `User`
- `Session`
- `Tenant`
- `Membership`
- `Invitation`
- `Project`
- `AuditLog`

The migration also creates a partial unique index for one active invitation per tenant/email pair.
