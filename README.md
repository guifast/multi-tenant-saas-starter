# Multi-Tenant SaaS Starter

A production-oriented TypeScript starter for SaaS products that need tenant isolation from day one.

It includes a Next.js web app, NestJS API, PostgreSQL, Prisma, session authentication, CSRF protection, RBAC, invitations, project CRUD, audit logs, Docker Compose, tests and CI.

## Stack

- Next.js 16, React 19, CSS tokens
- NestJS 11 REST API
- PostgreSQL 16 and Prisma 6
- pnpm 11 workspaces and Turborepo
- Vitest, ESLint, Prettier
- GitHub Actions quality gate

## Apps and Packages

```txt
apps/api              NestJS API
apps/web              Next.js web console
packages/database     Prisma schema, migrations and seed
packages/contracts    Shared Zod schemas
packages/config       Environment validation
packages/ui           Small shared UI primitives
```

## Local Setup

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open:

- Web: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs

Seed users use `SEED_PASSWORD` from `.env.example`.

- `owner@example.com`
- `admin@example.com`
- `member@example.com`
- `viewer@example.com`

## Quality Commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

## Core API

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /tenants`
- `GET /tenants`
- `GET /tenants/:slug`
- `PATCH /tenants/:slug`
- `GET /tenants/:slug/members`
- `PATCH /tenants/:slug/members/:membershipId`
- `DELETE /tenants/:slug/members/:membershipId`
- `POST /tenants/:slug/invitations`
- `GET /tenants/:slug/invitations`
- `DELETE /tenants/:slug/invitations/:invitationId`
- `POST /invitations/:token/accept`
- `POST /tenants/:slug/projects`
- `GET /tenants/:slug/projects`
- `GET /tenants/:slug/projects/:projectId`
- `PATCH /tenants/:slug/projects/:projectId`
- `DELETE /tenants/:slug/projects/:projectId`
- `GET /tenants/:slug/audit-logs`
- `GET /health`
- `GET /health/ready`

## Security Model

- Session token is stored as a hash in the database.
- Session cookie is HttpOnly.
- Mutating authenticated requests require `x-csrf-token` matching the readable `csrf` cookie.
- Tenant access is resolved through authenticated membership.
- Every tenant-owned resource query includes tenant scope.
- Invitation tokens are opaque and stored as hashes.
- Accepted invitations cannot be reused to add another account.
- Final OWNER removal/demotion is blocked.
- Passwords are hashed with bcrypt.

## License

MIT
