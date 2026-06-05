# Migration policy

Migrations run automatically: the backend container's `entrypoint.sh` calls
`prisma migrate deploy` on every start, before the server accepts traffic.

## Firm rules

1. **Forward-only.** Migrations always move forward. Never `prisma migrate reset`
   in production. If a migration has a bug, write a **new** migration to fix it —
   never edit a migration already merged to `main` (its checksum is recorded).
2. **Drops require a prior data migration.** Dropping a column that holds data is
   not allowed in a single step. Use three migrations:
   1. add the new column,
   2. a data migration (TypeScript) that copies old → new,
   3. drop the old column, only once the data is confirmed migrated.
3. **Smoke test gates the boot.** After `migrate deploy`, the entrypoint runs the
   seed and `dist/scripts/smoke-test.js`. If invariants fail (missing system user,
   fewer than the expected preset themes, orphan `activeThemeId`, non-writable
   uploads dir) the container exits non-zero and is marked unhealthy — no traffic.

## Applying a new migration

Author it in development:

```bash
cd backend
pnpm prisma migrate dev --name <change>
```

Commit the generated `prisma/migrations/<ts>_<change>/` folder. On the next
production `docker compose up -d --build`, `migrate deploy` applies it.

## If a migration fails at boot

Read `docker compose logs backend`, identify the failing statement, decide
whether to fix forward (new migration) or roll back the release
([rollback.md](./rollback.md)). Do not hand-edit `_prisma_migrations`.
