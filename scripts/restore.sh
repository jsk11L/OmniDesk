#!/usr/bin/env bash
# Restore an OmniDesk backup produced by scripts/backup.sh.
# ⚠ OVERWRITES the current database and uploads. Run from the repo root.
#   ./scripts/restore.sh ./backups/omnidesk-backup-YYYYMMDDTHHMMSSZ.zip
set -euo pipefail

[ -f .env ] && set -a && . ./.env && set +a

BACKUP_FILE=${1:?"Usage: $0 path/to/omnidesk-backup-YYYYMMDDTHHMMSSZ.zip"}
[ -f "$BACKUP_FILE" ] || { echo "File not found: $BACKUP_FILE"; exit 1; }
PROJECT=${COMPOSE_PROJECT_NAME:-omnidesk}

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "→ Extracting…"
unzip -q "$BACKUP_FILE" -d "$WORK_DIR"
DB_FILE=$(find "$WORK_DIR" -name "db-*.sql.gz")
UPLOADS_FILE=$(find "$WORK_DIR" -name "uploads-*.tar.gz")

echo "⚠ This will OVERWRITE the current database and uploads. Continue? [y/N]"
read -r confirm
[ "$confirm" = "y" ] || { echo "Aborted."; exit 1; }

echo "→ Stopping app services…"
docker compose stop backend frontend

echo "→ Restoring database…"
gunzip < "$DB_FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "→ Restoring uploads…"
docker run --rm \
  -v "${PROJECT}_uploads_data:/data" \
  -v "$WORK_DIR:/backup:ro" \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename "$UPLOADS_FILE") -C /data"

echo "→ Bringing services back up…"
docker compose up -d

echo "✓ Restore complete."
