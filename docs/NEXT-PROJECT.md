# Next Public Project: reliable-webhook-processor

This is a planning note only. Do not implement this project inside the SaaS starter monorepo.

## Goal

Create a separate public repository that demonstrates reliable event ingestion and asynchronous processing.

## Scope

- Webhook signature verification.
- Event persistence.
- Idempotency keys.
- Asynchronous processing.
- Retries with exponential backoff.
- Dead-letter state.
- Manual replay.
- Safe structured logs.
- Integration tests.
- Docker Compose.
- Local execution.
- No public deployment requirement.

## Suggested Stack

- Node.js and TypeScript.
- Fastify or NestJS.
- PostgreSQL.
- Prisma or Drizzle.
- Vitest.
- Docker Compose.

## Review Signal

The repository should prove reliability engineering fundamentals: exactly-once effects where possible, at-least-once delivery handling, clear failure states and safe replay behavior.
