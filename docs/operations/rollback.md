# Rollback

Because migrations are **forward-only**, a rollback is not "downgrade the schema"
— it is "restore the last good backup and run the previous image".

```bash
cd /opt/omnidesk
docker compose stop backend frontend
git checkout <previous-tag>
./scripts/restore.sh ./backups/<backup-taken-before-the-upgrade>.zip
docker compose up -d --build
```

## Why a backup is required

If the failed upgrade applied a destructive migration (e.g. a dropped column),
checking out the old code is not enough — the data is already gone from the DB.
Only the pre-upgrade backup recovers it. This is exactly why
[upgrade.md](./upgrade.md) step 1 is "back up first".

## If the upgrade only failed the smoke test (no schema damage)

Often the DB is fine and only boot invariants failed (e.g. a missing env var).
Fix the cause (`.env`, config), then `docker compose up -d --build` again — no
restore needed.
