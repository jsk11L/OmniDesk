# Changelog

All notable changes to OmniDesk. Breaking changes are called out explicitly.

## [Unreleased]

### Added
- **Deployment infrastructure (Block 1):** multi-stage `backend/Dockerfile` and
  `frontend/Dockerfile` (pnpm workspace, built from the repo root context),
  `docker-compose.yml` (postgres + backend + frontend + nginx, healthchecks,
  named volumes), `docker-compose.dev.yml` (Postgres-only for local hot reload),
  edge `infra/nginx.conf` reverse proxy + in-container `infra/frontend-nginx.conf`,
  container `entrypoint.sh` (migrate deploy → seed → smoke test → serve),
  `scripts/backup.sh` / `scripts/restore.sh`, exhaustive root `.env.example`,
  and `docs/operations/` runbooks.
- **D-011 stage 1:** `@omnidesk/shared` package with entity types generated from
  the Prisma schema; frontend consumes them to remove frontend↔backend drift.
- Block 0 sanitation: multi-tenant e2e suite, mismatch fixes (#1, #2, #5, #7, #8),
  `User.timezone` / `User.deletedAt` / `Note.plainText` / `TodoColumn.isCompletionColumn`,
  soft-delete purge cron, env validation, offset pagination, smoke test.

### Changed
- Full UI + backend message migration to **English**.
- `prisma` and `tsx` moved to backend production dependencies (needed by the
  container entrypoint to run migrations and the idempotent seed).

[Unreleased]: https://github.com/jsk11L/OmniDesk/commits/main
