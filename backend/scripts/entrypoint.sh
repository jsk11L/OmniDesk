#!/bin/sh
# OmniDesk backend container entrypoint.
# Applies pending migrations and verifies boot invariants before serving.
set -e

# Retry `migrate deploy`. On hosts without a dedicated release phase (e.g. Render
# free), this runs on EVERY container start, so a migrate killed mid-flight can
# leave its advisory lock held until the database reaps the dead session. Two
# containers cold-starting at once race for the same lock too. Retrying rides
# over that transient window instead of crash-looping the service.
run_migrations() {
  i=1
  max=5
  while [ "$i" -le "$max" ]; do
    if node_modules/.bin/prisma migrate deploy; then
      return 0
    fi
    echo "  ⚠ migrate attempt $i/$max failed (likely a held advisory lock); retrying in 6s…"
    i=$((i + 1))
    sleep 6
  done
  echo "✗ migrations failed after $max attempts — aborting boot"
  return 1
}

# Set RUN_MIGRATIONS=false to skip this here and run it elsewhere instead (e.g. a
# Render *Pre-Deploy Command* on paid plans, so cold starts stay fast and never
# touch the migrate lock). Defaults to running here (docker-compose self-host).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "→ Applying database migrations (prisma migrate deploy)…"
  run_migrations

  echo "→ Seeding system data (idempotent: system user + preset themes)…"
  node_modules/.bin/tsx prisma/seed.ts

  echo "→ Running post-migration smoke test…"
  node dist/scripts/smoke-test.js
else
  echo "→ RUN_MIGRATIONS=false — skipping migrate/seed/smoke (handled in a pre-deploy step)."
fi

echo "→ Starting OmniDesk API…"
exec "$@"
