# syntax=docker/dockerfile:1

# Base stage
FROM oven/bun:1.3.3-debian AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Prepare stage
FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .

RUN turbo prune @repo/api --docker

# Build stage
FROM base AS build

# Copy pruned package.json files and lockfile
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/bun.lock ./bun.lock

RUN bun install --frozen-lockfile

# Copy full source code
COPY --from=prepare /app/out/full/ .

ENV NODE_ENV=production

# Build (bundle without compile due to native sharp dependency)
WORKDIR /app/apps/api
RUN bun build \
    --target=bun \
    --outdir=./dist \
    --minify \
    ./src/index.ts

RUN ls -la dist/

# Runtime stage
FROM oven/bun:1.3.3-debian AS runtime

# Install wget for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

COPY --from=build /app/apps/api/dist ./dist

COPY --from=build /app/node_modules ./node_modules

# Copy drizzle config and migrations for runtime migration
COPY --from=build /app/apps/api/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/apps/api/drizzle ./drizzle

# Copy entrypoint script
COPY --from=build /app/apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

ENV NODE_ENV=production

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
