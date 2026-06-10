# Fresh install (Docker)

Brings up the full stack (Postgres + backend + frontend + nginx) on a host with
Docker and the Compose plugin.

## Steps

```bash
git clone https://github.com/jsk11L/OmniDesk.git /opt/omnidesk
cd /opt/omnidesk
cp .env.example .env
# Edit at least: POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL
#   JWT secrets: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
#   VAPID (optional, for push): npx web-push generate-vapid-keys
docker compose up -d --build
```

The backend container `entrypoint.sh` runs, in order:

1. `prisma migrate deploy` — applies pending migrations.
2. `tsx prisma/seed.ts` — idempotent seed (system user + preset themes).
3. `node dist/scripts/smoke-test.js` — boot invariants; **the container refuses
   to start if they fail** (e.g. seed didn't produce the expected system data).

## Verify

```bash
docker compose ps                      # all services healthy
curl -f http://localhost/api/health    # {"status":"ok",...} through the edge nginx
```

Then open `http://<host>/`, register (the **first user becomes admin**),
verify the email (printed in `docker compose logs backend` when SMTP is unset),
log in.

## TLS

Ships HTTP-only so the stack works immediately. To serve HTTPS, see
[https-setup.md](./https-setup.md).

## Notes

- Images build from the **repo root** context (pnpm workspace) — that's why
  `docker compose build` must run from the repo root.
- Uploads live in the `uploads_data` volume; the DB in `pg_data`. Back them up
  with [backup.md](./backup.md).
