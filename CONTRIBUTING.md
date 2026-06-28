# Contributing

## Development

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Pull Request Checklist

- Keep tenant-owned data scoped by tenant id.
- Do not return password hashes, session tokens or invitation token hashes.
- Add tests for authorization or isolation changes.
- Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.

## Commit Style

Use small, descriptive commits. Prefer one concern per commit.
