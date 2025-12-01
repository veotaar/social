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

RUN turbo prune @repo/web --docker

# Build stage
FROM base AS build

COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/bun.lock ./bun.lock

RUN bun install --frozen-lockfile

COPY --from=prepare /app/out/full/ .

ARG BUN_PUBLIC_API_URL
RUN test -n "$BUN_PUBLIC_API_URL" || (echo "ERROR: BUN_PUBLIC_API_URL build arg is required" && exit 1)

ENV NODE_ENV=production
ENV BUN_PUBLIC_API_URL=$BUN_PUBLIC_API_URL

# Generate routes and build static assets
WORKDIR /app/apps/web
RUN bun run build

# Compile the static file server to a single executable
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target=bun \
    --outfile=server \
    ./server.ts

# Runtime stage
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# Copy the compiled server binary
COPY --from=build /app/apps/web/server ./server

# Copy built static assets
COPY --from=build /app/apps/web/dist ./dist

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

ENV NODE_ENV=production

EXPOSE 3001

CMD ["./server"]
