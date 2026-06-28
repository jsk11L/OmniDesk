# Backup & restore

A backup is a single zip containing a `pg_dump` (gzipped) plus a tarball of the
`uploads_data` volume. `.env`, TLS certs and logs are **not** backed up (secrets
stay with you; certs and logs regenerate).

## Create a backup

```bash
cd /opt/omnidesk
./scripts/backup.sh
# → ./backups/omnidesk-backup-YYYYMMDDTHHMMSSZ.zip
```

Configurable via `.env`: `BACKUP_DIR` (default `./backups`),
`BACKUP_RETENTION_DAYS` (default 30 — older zips are pruned).

### Daily cron

```cron
0 3 * * * cd /opt/omnidesk && ./scripts/backup.sh >> /var/log/omnidesk-backup.log 2>&1
```

Copy the zip off-host (object storage, another machine) — a backup on the same
disk that dies with it is not a backup.

## Restore

⚠ **Overwrites** the current database and uploads.

```bash
cd /opt/omnidesk
./scripts/restore.sh ./backups/omnidesk-backup-YYYYMMDDTHHMMSSZ.zip
```

It stops `backend`/`frontend`, restores the DB and uploads, then brings the
stack back up.

## Mandatory restore test

Before every major release, run a **backup → wipe → restore** cycle on staging
and verify row counts. If a restore fails or takes >5 min, do not ship.
