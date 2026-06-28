FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages packages
RUN pnpm install --filter @saas/api... --frozen-lockfile

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @saas/database db:generate
RUN pnpm --filter @saas/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
