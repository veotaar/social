#!/bin/sh
set -e

echo "Running database migrations..."
bunx drizzle-kit migrate

echo "Starting server..."
exec bun run ./dist/index.js
