# Changelog

All notable changes to OmniDesk. Breaking changes are called out explicitly.

## [Unreleased]

### Added
- **Unified card model (lists):** the Large and Cover cards collapse into a single
  **Card** view parametrized by three orthogonal controls in the toolbar — **Shape**
  (Cover 7:4 / Poster 2:3 / Square 1:1 / Free), **Text position** (On image /
  Below / Above) and a **Text bg** toggle (a solid panel behind on-image text for
  legibility). "Large Card" and "Cover Card" were the same card differing only in
  text position, so they are now one. Action buttons (set/move) render on **every**
  view — Card, Compact, List, Gallery and Table — not just the large card. Legacy
  `card-large` / `card-cover` / `poster` / `square` templates fold into the new
  model with matching defaults (no migration; all in `gridConfig`).
- **Real data footprint in Storage:** Settings → Security now shows, besides the
  uploaded-image quota, the byte size of all your actual content broken down by
  module (Notes, List items, Calendar, To-Do, Habits, Finance) with counts — so
  "0 KB" no longer misleads when your data lives in the database, not in uploads.
- **List random picker:** an optional 🎲 button (toggled in list Settings → Extras)
  that spins a roulette over the currently-visible items and opens a random one.
- **List templates + presets:** new poster (2:3) and square (1:1) card shapes,
  plus a ✨ Templates gallery that scaffolds a ready list — Movies (Letterboxd),
  Music albums, Books, TV series, Games, or Blank — with suggested fields, card
  layout and style. Adding a preset is data, not code (one configurable engine).
- **Multi-count habits:** optional daily **minimum** and **maximum** check-ins
  (e.g. brush teeth min 2, max 4; water 8). Tapping a day adds a check-in up to
  the cap; the day is "done" at the minimum. Streaks, heatmap and completion %
  are count-aware and backward-compatible (existing habits stay done-at-1). Plus
  a ⭐ **featured habit** picker for the hero panel and richer goal labels.
- **Android app scaffold (Capacitor):** `capacitor.config.ts`, root deps/scripts
  and an `android/SETUP.md` runbook to wrap the PWA into a native Android shell
  (one codebase). Native project generation (`cap add android`) is run locally.
- **Card typography levels (lists):** a 🎨 Style editor defines four named levels
  (Title / Subtitle / Body / Caption) — each with font (7 curated families),
  size, weight, colour, uppercase and text-shadow — plus card background, border
  and an image overlay (scrim) for legibility over light images. Assign any
  field to a level; replaces the old fixed auto-scaling. Applies to the Large
  and Cover cards; all in `gridConfig` (no migration).
- **TO-DO tag filter:** filter the board by tags with Any/All (OR/AND) matching
  and a live count; reordering is paused while a filter is active.
- **Edit existing list fields:** the Fields section now lets you rename, change
  type, toggle required, and edit Select options on fields that already exist —
  with live warnings about what each change implies (type change keeps values
  as-is; removing Select options orphans items using them; deleting a field
  drops its column from every item).
- **Free-tier deployment (Cloudflare Pages + Render + Neon):** a `render.yaml`
  blueprint for the Docker backend (auto-generated JWT secrets, health check,
  env contract), a build-time `set-env.js` that bakes the API URL into the
  Angular bundle, an `_redirects` SPA fallback, and a step-by-step runbook at
  `docs/operations/deploy-cloudflare-render-neon.md`.
- **Language selector (i18n):** runtime English/Spanish switch via ngx-translate,
  persisted to `localStorage` and seeded from the browser locale. A selector in
  the sidebar footer; the shell navigation is translated, with `en`/`es` JSON
  catalogues to extend the rest of the UI incrementally.
- **List card designer (Large card):** per-field layout — anchor a field to any
  of 9 zones (3×3 matrix), stack it above the title with auto-scaled typography,
  or keep it in the body; hide the "Field:" label; and render DATE fields as
  month-only / month+year / year (e.g. show just "May" when grouping by year).
  Each field gets its own layout button in the Fields popover.
- **Obsidian → list import:** turn a vault `.zip` into list items — YAML
  frontmatter keys become custom fields (types inferred), `tags` + folders
  become list tags, images upload to assets, and the new fields show on cards.
  A pre-import panel (dry-run analyze) lets you rename/retype/exclude each
  detected field, with warnings when a chosen type doesn't fit the values.
- **Brand icon set:** gradient "O" monogram — SVG favicon, PWA (192/512, with
  separate `any` + `maskable`) and apple-touch icons, replacing the missing ones.
- **Calendar day-add affordance:** hovering a day tints the cell and shows a "+".
- **Finance Wishlist & Savings mini-dashboard:** wishlist value, saved-in-goals
  and left-to-save stat cards; the Wishlist & Savings tab now comes first.
- **Calendar event tags + filter:** events carry tags and the calendar shows a
  tag filter bar; plus a visible hint that clicking a day adds an event.
- **Finance tabs + currency switcher:** Expenses & Budgets and Wishlist &
  Savings are now tabs; the dead board switcher is replaced by a display-currency
  selector (USD/EUR/CLP/…).
- **Lists power-features:** pick which custom fields show on cards and reorder
  them (Fields popover); group by a DATE field at Year or Month granularity;
  and configurable one-click **action buttons** on cards that set a Select field
  to a value (e.g. a games backlog → Completed).
- **Notes & TO-DO polish (design handoff):** notes list shows a total count,
  a Pinned section above All, and pages the All list horizontally (‹ x/y ›)
  instead of scrolling — pinned capped at 5 (server-enforced). Kanban columns
  now flex to fill the board width with softer, rounded borders.
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

### Fixed
- **Calendar day-add affordance:** the "+" now sits centered in the day cell,
  the hover tint covers the whole cell, and the action cursor shows only on the
  button.
- **Themed borders no longer render white:** the design tokens (`border-soft`,
  `surface-2`, `text-faint`, `primary-ghost`…) are now registered as Tailwind
  colors, so `border-border-soft` etc. follow the active theme instead of
  falling back to Tailwind's default light grey (TO-DO, calendar, finance).
- **Custom theme no longer bleeds past logout:** the active theme's inline CSS
  variables are reset on sign-out, so the login screen and the next account
  start from the default palette.
- **Kanban columns:** dropped the stray white top border (an invalid
  `border-top` when a column had no colour); softened the header divider.
- **Dialogs no longer double-play** their open animation on first interaction
  (switched from async to eager animation providers).

### Changed
- **Habits** can only be checked for today and yesterday; older days lock with a
  clear visual indicator.
- Full UI + backend message migration to **English**.
- `prisma` and `tsx` moved to backend production dependencies (needed by the
  container entrypoint to run migrations and the idempotent seed).

[Unreleased]: https://github.com/jsk11L/OmniDesk/commits/main
