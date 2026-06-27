# Changelog

All notable changes to OmniDesk. Breaking changes are called out explicitly.

## [Unreleased]

### Added
- **Sidebar favorites:** pin any list or note to a Favorites section in the
  sidebar (★ on a list, 🔖 in the note editor), backed by a generic `Favorite`
  model that resolves each target's live label + icon and drops stale entries.
- **Shell redesign (design handoff):** sidebar with gradient logo, a ⌘K
  search/command pill, iconned nav with an active accent bar, and a footer of
  Notifications · Settings · Admin + a profile pill with sign-out; a more
  prominent top-bar search and roomier breadcrumb padding; and bigger tap
  targets for note + kanban icon buttons.
- **Recurring transactions:** finance templates (subscriptions, salary, rent…)
  with daily/weekly/monthly/yearly cadence, materialized into real transactions
  by an hourly scheduler (with bounded catch-up), pause without deleting, and a
  management section + dialog in the finance dashboard.
- **UI design pass:** responsive app shell with a breadcrumb top bar (⌘K + bell)
  and a mobile off-canvas sidebar; richer finance dashboard (month-over-month
  balance delta, savings rate, clickable category breakdown, transaction filters,
  CSV export); responsive dashboard/notes/finance and wrapping page headers;
  dialogs no longer squeeze their content.
- **Dogfooding fixes (Block 1.5):** note switching/autosave + list markers,
  list image-input URL default + dialog sizing, sidebar avatar, editable budgets,
  dashboard task detail, note fonts + image controls, kanban column reorder,
  habit goal periods + completion mini-calendar.
- **Public multi-user (Block 2):** first-user admin, account suspension, login
  lockout, soft-delete account + restore + uploads purge, per-user upload quota,
  Cloudflare Turnstile captcha + Terms/no-data-selling acceptance, admin panel
  (`/admin/*` + `/app/admin`), audit log, and optional TOTP two-factor auth.
- **Complete notifications (Block 3):** attach reminders to all 8 entities,
  timezone-aware contextual triggers (todo due, habit time-of-day, planned
  date), do-not-disturb preferences, and the reusable attach panel in dialogs.
- **Finance organizer (Block 4):** wishlist, planned purchases and savings
  goals UI over the existing backend.
- **Data export/import (Block 5/5b):** full `.zip` export (data.json + per-note
  Markdown + uploads), per-note Markdown download, and import of an OmniDesk
  export with merge or replace modes.
- **Obsidian import (Block 6):** vault `.zip` import — folders→tags, wikilinks,
  embeds, frontmatter, dedupe — with a result report.
- **Global search (Block 7):** full-text notes (GIN index) + events/lists/todos,
  surfaced in the Ctrl+K command palette.
- **Polish (Block 8):** dashboard N+1 fix and hot-path DB indices.
- **Follow-ups:** calendar reminders via the generic attach panel, savings-goal
  milestone notifications (50/80/100%), push device list/revoke, and a larger
  nginx body limit on the import route.
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
