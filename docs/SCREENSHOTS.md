# Screenshot Guide

Do not commit generated or fake screenshots. Capture the running local app after seed data is loaded.

Recommended dimensions:

- Dashboard: 1600 x 1000
- Feature screen: 1440 x 900
- README cover: 1600 x 900

Required files:

- `docs/images/dashboard.png`
- `docs/images/projects.png`
- `docs/images/members.png`
- `docs/images/audit-log.png`
- `docs/images/workspace-switcher.png`

Suggested flow:

1. `docker compose up -d postgres`
2. `pnpm db:migrate`
3. `pnpm db:seed`
4. `pnpm dev`
5. Sign in as `owner@example.com`.
6. Capture the workspace console, project list, members, audit log and workspace switcher.
