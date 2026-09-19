# Build the NestJS API. Run from the repo root:
#   docker build -f apps/api/Dockerfile -t clique-api .
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# --- Install deps (workspace-aware) ---
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile || pnpm install

# --- Build ---
FROM deps AS build
COPY . .
RUN pnpm --filter @clique/shared build \
 && pnpm --filter @clique/api prisma:generate \
 && pnpm --filter @clique/api build

# --- Runtime ---
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
