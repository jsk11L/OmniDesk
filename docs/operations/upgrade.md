# Upgrading between versions

```bash
cd /opt/omnidesk
./scripts/backup.sh                 # 1. always back up first
git fetch && git checkout <tag>     # 2. move to the target version
docker compose up -d --build        # 3. rebuild + restart (runs migrate deploy + smoke test)
docker compose logs -f backend      # 4. watch for "Smoke test passed"
curl -f http://localhost/api/health # 5. confirm health
```

- Step 3 applies any new migrations automatically (see [migrations.md](./migrations.md)).
- If the smoke test fails, the backend container stays unhealthy and serves no
  traffic — investigate the logs before retrying.
- Review `CHANGELOG.md` for breaking changes and any new required `.env` vars
  before upgrading.

If something goes wrong, see [rollback.md](./rollback.md).
