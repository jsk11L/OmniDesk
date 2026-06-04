# OmniDesk

An all-in-one personal organizer in a single SPA: calendar, library-style lists, notes with a rich-text editor, a Kanban TO-DO board, finance management, notifications (in-app, browser push and email) and fully customizable themes.

Built for personal use: a single account per installation, no multi-user collaboration, self-hostable end to end.

---

## Features

- **Calendar** — month, week, day and agenda views; all-day or ranged events; per-event scheduled reminders with push and/or email notification.
- **Lists** — custom libraries (games, books, music, movies, whatever you want) with user-defined fields, colored tags, per-item cover images (via URL) and grid or table views.
- **Notes** — TipTap editor with debounced auto-save every 2 seconds, image and link support, pinning of favorite notes, real-time search and a `Ctrl+N` shortcut for a new note.
- **TO-DO Kanban** — board with configurable columns, drag & drop between columns (Angular CDK), item reordering, due date and priority per card.
- **Finance** — multiple boards (accounts), income/expense categories, per-category budgets, optional recurring transactions, dashboard with balance and composition charts (Chart.js).
- **Notifications** — three channels: in-app inbox, browser push (Web Push API + VAPID) and email (Nodemailer). Cron-style `recurringRule` rules, evaluated by a scheduler that runs every minute.
- **Themes** — preset themes (Obsidian Dark, Notion Light, Midnight Blue, Forest, Sunset, …) plus unlimited custom themes; every color, font and border radius maps to CSS custom properties injected into `:root`.
- **Command palette** — open with `Ctrl+K` from any view to navigate quickly between modules.

---

## Tech stack

**Backend** (NestJS 10 standalone modules)
- Strict TypeScript, Prisma 5 + PostgreSQL 18
- Passport JWT (access + refresh) with bcrypt 12 rounds
- `class-validator` with strict DTOs on ALL endpoints (`whitelist: true`, `forbidNonWhitelisted: true`)
- `@nestjs/throttler` with a global rate limit of 100/15min and `/auth/*` reduced to 10/15min
- `@nestjs/schedule` with `@Cron(EVERY_MINUTE)` to evaluate and fire notifications
- `web-push` with VAPID for browser push
- `nodemailer` with a fallback to console mode if the SMTP host is the placeholder
- Helmet with strict CSP (`default-src 'none'`), HSTS in production, CORS with a functional validator
- JSONB sanitization against prototype pollution (depth, key, array and string caps)

**Frontend** (Angular 18 standalone components)
- Signals + `computed()` + the new control flow (`@if` / `@for` / `@switch` / `@let`)
- `ChangeDetectionStrategy.OnPush` on every component
- Tailwind CSS on top of CSS custom properties (themes repaint the whole app without recompiling)
- Angular Material Dialog for modals, `@angular/cdk` DragDrop for the Kanban
- FullCalendar 6 (dayGrid + timeGrid + list + interaction)
- TipTap 2 (StarterKit + Image + Link) with auto-save via RxJS `Subject + debounceTime`
- Chart.js 4 + `ng2-charts` 6 for the finance dashboard charts
- `ngx-toastr` for error and success feedback
- A dedicated Service Worker (`sw.js`) to receive browser push

**Infrastructure**
- `pnpm workspace` monorepo (root + `backend` + `frontend`)
- Node.js 20 LTS, PostgreSQL 18

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Angular 18 SPA                    │
│   Auth · Calendar · Lists · Notes · Todos · Finance  │
│         Notifications · Settings · Themes            │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP (JWT in Authorization)
                       │ Web Push (VAPID)
                       ▼
┌──────────────────────────────────────────────────────┐
│              NestJS 10 — REST API                    │
│  AuthGuard → DTO validation → Service → Prisma → DB  │
│                                                      │
│  + @Cron(EVERY_MINUTE) scheduler:                    │
│    evaluates due NotificationConfig records,         │
│    creates InAppNotification, sends push and email   │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
                  PostgreSQL 18
                  (Prisma models)
```

Every REST response has the shape `{ data, meta?, error? }`. The `userId` is always extracted from the JWT via the `@CurrentUser()` decorator, NEVER from the request body. Images are ALWAYS validated URL strings — relative `/uploads/...` paths are also accepted for files served by the backend.

---

## Repo structure

```
.
├── backend/                  NestJS application
│   ├── prisma/               schema.prisma + seed.ts (system themes)
│   ├── src/
│   │   ├── auth/             Register, verify-email, login, refresh, me
│   │   ├── users/            PATCH /users/me
│   │   ├── themes/           CRUD + activate
│   │   ├── calendar/         Events + reminders
│   │   ├── notes/            CRUD + attach notifications
│   │   ├── todos/            Boards, columns, items, reorder
│   │   ├── lists/            Lists + items + fields + tags
│   │   ├── finance/          Boards, transactions, categories, budgets, summary
│   │   ├── notifications/    CRUD, scheduler, push subscriptions, inbox
│   │   ├── mail/             Nodemailer with console fallback
│   │   ├── prisma/           Global PrismaService
│   │   └── common/           Filters, interceptors, decorators, utils
│   └── test/                 E2E tests (auth, themes, multi-tenant, …)
├── shared/                   Generated entity types shared with the frontend (D-011)
└── frontend/                 Angular 18 application
    ├── src/app/
    │   ├── core/             Auth guard, interceptor, services, models
    │   ├── shared/           main-layout, sidebar, command palette, dialogs
    │   └── features/         One module per domain (auth, calendar, lists, …)
    ├── src/sw.js             Service worker for push
    └── src/styles.scss       Tailwind + CSS custom properties
```

---

## Requirements

- Node.js 20 LTS
- pnpm 9+ (preferably via `corepack enable && corepack prepare pnpm@latest --activate`)
- PostgreSQL 18 (local, Docker or managed)
- A Postgres client to create the database manually (pgAdmin 4, DBeaver, `psql`, etc.)

---

## Usage

Once installed and configured (the step-by-step local install guide is not published in this repo), the flow is:

1. **Register** at `/auth/register`. A verification email is sent (or printed to the console if you didn't configure a real SMTP host).
2. **Verify the email** with the received token — the server requires a verified email to log in.
3. **Log in** → you get an `accessToken` (15 min) and a `refreshToken` (7 days).
4. **Dashboard** with quick access to the modules. `Ctrl+K` opens the command palette.
5. **Settings → Theme editor** to create your own theme or activate one of the presets.
6. **Settings → Profile** to change displayName, password or subscribe to browser push.

The scheduler runs inside the same NestJS process — you don't need an external cron.

---

## License

[MIT](./LICENSE).
