#!/usr/bin/env bash
# Full OmniDesk backup: pg_dump (gzip) + uploads volume (tar.gz), zipped together.
# Run from the repo root where docker-compose.yml lives. Cron example:
#   0 3 * * * cd /opt/omnidesk && ./scripts/backup.sh >> /var/log/omnidesk-backup.log 2>&1
set -euo pipefail

# Load .env so POSTGRES_USER/DB and BACKUP_* are available.
[ -f .env ] && set -a && . ./.env && set +a

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_DIR=${BACKUP_DIR:-./backups}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
PROJECT=${COMPOSE_PROJECT_NAME:-omnidesk}

mkdir -p "$BACKUP_DIR"

echo "→ Dumping postgres…"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --clean --if-exists \
  | gzip > "$BACKUP_DIR/db-$TIMESTAMP.sql.gz"

echo "→ Archiving uploads…"
docker run --rm \
  -v "${PROJECT}_uploads_data:/data:ro" \
  -v "$(pwd)/$BACKUP_DIR:/backup" \
  alpine tar czf "/backup/uploads-$TIMESTAMP.tar.gz" -C /data .

echo "→ Combining…"
zip -j "$BACKUP_DIR/omnidesk-backup-$TIMESTAMP.zip" \
  "$BACKUP_DIR/db-$TIMESTAMP.sql.gz" \
  "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"
rm "$BACKUP_DIR/db-$TIMESTAMP.sql.gz" "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz"

echo "→ Pruning backups older than ${RETENTION_DAYS} days…"
find "$BACKUP_DIR" -name "omnidesk-backup-*.zip" -mtime +"$RETENTION_DAYS" -delete

echo "✓ Backup ready: $BACKUP_DIR/omnidesk-backup-$TIMESTAMP.zip"
