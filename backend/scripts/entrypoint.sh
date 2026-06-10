#!/bin/sh
# OmniDesk backend container entrypoint.
# Applies pending migrations and verifies boot invariants before serving.
set -e

echo "→ Applying database migrations (prisma migrate deploy)…"
node_modules/.bin/prisma migrate deploy

echo "→ Seeding system data (idempotent: system user + preset themes)…"
node_modules/.bin/tsx prisma/seed.ts

echo "→ Running post-migration smoke test…"
node dist/scripts/smoke-test.js

echo "→ Starting OmniDesk API…"
exec "$@"
