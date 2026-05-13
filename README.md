# OmniDesk Web

Aplicación web SPA de organización personal: calendario, listas, notas, kanban TO-DO,
gestión financiera, notificaciones (in-app + push + email) y temas personalizables.

Documentación técnica completa: [`OMNIDESK_SPEC.md`](./OMNIDESK_SPEC.md).
Variables y placeholders a reemplazar: [`CHANGE_ME.md`](./CHANGE_ME.md).

---

## Stack

- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL 15+ + Passport JWT
- **Frontend** (próximas fases): Angular 18 + Tailwind + Angular Material + FullCalendar + TipTap + Chart.js
- **Monorepo**: pnpm workspace

---

## Requisitos previos

- Node.js 20 LTS
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 15+ corriendo localmente (o vía Docker)
- pgAdmin 4 (o cualquier cliente Postgres) para crear la base manualmente

---

## Setup inicial — Fase 1

```powershell
# 1. Instalar dependencias del monorepo
pnpm install

# 2. Crear la base de datos en pgAdmin: nombre "omnidesk"
#    Owner: el usuario que vas a usar en DATABASE_URL.

# 3. Crear backend/.env copiando la plantilla de CHANGE_ME.md
#    (el archivo no se versiona; ver CHANGE_ME.md para placeholders)

# 4. Generar el cliente Prisma y aplicar la migración inicial
pnpm db:migrate
# Te preguntará un nombre para la migración → "init"

# 5. Sembrar el usuario system + los 5 temas predefinidos
pnpm db:seed

# 6. Levantar el backend en modo watch
pnpm backend:dev
# API disponible en http://localhost:3000
```

### Verificación

```powershell
# Healthcheck público (sin auth)
curl http://localhost:3000/health
# Respuesta esperada: { "data": { "status": "ok", "timestamp": "..." } }
```

---

## Estructura

```
omnidesk/
├── backend/                  # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma     # 21 modelos
│   │   └── seed.ts           # system user + 5 temas predefinidos
│   └── src/
│       ├── auth/             # registro, login, refresh, verify, reset password
│       ├── users/            # perfil + seed de defaults por usuario nuevo
│       ├── themes/           # CRUD temas + activate
│       ├── calendar/         # CRUD eventos + attach/detach notifications
│       ├── notes/            # CRUD notas + attach/detach notifications
│       ├── todos/            # boards/columns/items + reorder
│       ├── lists/            # lists/items/fields/tags + filtros
│       ├── finance/          # boards/categories/transactions/budgets + summary
│       ├── notifications/    # configs/inbox/push + fire manual
│       ├── mail/             # Nodemailer con fallback a consola
│       ├── prisma/           # PrismaService global
│       └── common/           # filter, interceptor, decorator
├── CHANGE_ME.md              # placeholders a reemplazar
├── OMNIDESK_SPEC.md          # spec técnica completa (fuente de verdad)
└── pnpm-workspace.yaml
```

---

## Endpoints disponibles (Fases 1 + 2)

Todos retornan `{ data, meta?, error? }` (interceptor global) y los errores siguen el
formato `{ error: { code, message, statusCode, path, timestamp } }`. Todos los protegidos
extraen `userId` del JWT vía `@CurrentUser()`.

### Auth (público, rate limit 10/15min)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/health` | Healthcheck |
| POST | `/auth/register` | Crea cuenta + seed de defaults + envía email de verificación |
| POST | `/auth/verify-email` | Activa la cuenta (body: `{ token }`) |
| POST | `/auth/login` | Login (body: `{ email, password }`) |
| POST | `/auth/refresh` | Renueva access token (body: `{ refreshToken }`) |
| POST | `/auth/forgot-password` | Inicia reset (body: `{ email }`) |
| POST | `/auth/reset-password` | Aplica reset (body: `{ token, newPassword }`) |
| GET | `/auth/me` | Perfil del usuario autenticado (protegido) |

### Themes (`/themes`, protegido)
- `GET /themes` — propios + sistema (isDefault)
- `POST /themes` — crear propio
- `GET /themes/:id` — uno
- `PATCH /themes/:id` — actualizar (solo propios, no system)
- `DELETE /themes/:id` — eliminar (solo propios)
- `PATCH /themes/:id/activate` — activar tema para el usuario

### Calendar (`/calendar/events`, protegido)
- `GET /calendar/events?start=ISO&end=ISO`
- `POST /calendar/events`
- `GET /calendar/events/:id`
- `PATCH /calendar/events/:id`
- `DELETE /calendar/events/:id`
- `POST /calendar/events/:id/notifications` — body `{ notificationId, minutesBefore? }`
- `DELETE /calendar/events/:id/notifications/:notifId`

### Notes (`/notes`, protegido)
- `GET /notes?q=&tag=&pinned=`
- `POST /notes`
- `GET /notes/:id`
- `PATCH /notes/:id`
- `DELETE /notes/:id`
- `POST /notes/:id/notifications` — body `{ notificationId }`
- `DELETE /notes/:id/notifications/:notifId`

### TO-DO (`/todos`, protegido)
- `GET /todos/boards` · `POST /todos/boards`
- `GET /todos/boards/:id` (incluye columns + items) · `PATCH` · `DELETE`
- `POST /todos/boards/:id/columns` · `PATCH /todos/boards/:id/columns/:colId` · `DELETE`
- `POST /todos/boards/:id/columns/:colId/items`
- `PATCH /todos/items/:itemId` (incluye mover de columna)
- `DELETE /todos/items/:itemId`
- `POST /todos/items/reorder` — body `{ items: [{ id, columnId, position }] }`

### Lists (`/lists`, protegido)
- `GET /lists` · `POST /lists` · `GET /lists/:id` (incluye fields + tags) · `PATCH` · `DELETE`
- `GET /lists/:id/items?q=&tag=&sort=&dir=`
- `POST /lists/:id/items` · `PATCH /lists/:id/items/:itemId` · `DELETE`
- `POST /lists/:id/fields` · `PATCH /lists/:id/fields/:fieldId` · `DELETE`
- `POST /lists/:id/tags` · `DELETE /lists/:id/tags/:tagId`

### Finance (`/finance`, protegido)
- `GET /finance/boards` · `POST` · `GET /finance/boards/:id` (incluye categories + budgets) · `PATCH` · `DELETE`
- `GET /finance/boards/:id/transactions?start=&end=&type=&category=` · `POST` · `PATCH /:txId` · `DELETE /:txId`
- `POST /finance/boards/:id/categories` · `PATCH /:catId` · `DELETE /:catId`
- `POST /finance/boards/:id/budgets` · `PATCH /:budId` · `DELETE /:budId`
- `GET /finance/boards/:id/summary?start=&end=` — `{ income, expense, balance, byCategory[] }`

### Notifications (`/notifications`, protegido)
- `GET /notifications` · `POST` · `GET /:id` · `PATCH` · `DELETE`
- `POST /notifications/:id/fire` — dispara manualmente (IN_APP + PUSH + EMAIL según `channels`)
- `GET /notifications/inbox` — no leídas
- `PATCH /notifications/inbox/:id/read`
- `DELETE /notifications/inbox/clear` — borra las ya leídas
- `POST /notifications/push/subscribe` — body `{ endpoint, keys: { p256dh, auth } }`
- `DELETE /notifications/push/unsubscribe` — body `{ endpoint }`

**Rate limiting:**
- Global: 100 req / 15 min por IP
- `/auth/*`: 10 req / 15 min por IP

**Notas de seguridad:**
- Todo endpoint protegido usa `@UseGuards(JwtAuthGuard)` a nivel de controller.
- `userId` SIEMPRE viene del JWT vía `@CurrentUser()`, nunca del body.
- Toda imagen es validada con `@IsUrl({ protocols: ['http', 'https'], require_protocol: true })`.
- ParseUUIDPipe valida todos los parámetros de ID en la ruta.
- Cada operación de mutación verifica ownership (`findFirst` con filtro `userId`) antes de actuar.

---

## Comandos útiles

```powershell
pnpm backend:dev          # NestJS en modo watch
pnpm backend:build        # Compila a backend/dist/
pnpm backend:start        # Corre el build de producción
pnpm db:migrate           # Crea/aplica migración (dev)
pnpm db:generate          # Regenera el cliente Prisma
pnpm db:seed              # Re-corre el seed (idempotente)
pnpm db:studio            # Abre Prisma Studio en el navegador
pnpm --filter backend typecheck   # tsc --noEmit
pnpm --filter backend test        # tests unitarios
```

---

## Próximas fases

- ~~Fase 1~~ — Monorepo + NestJS + Prisma + Auth + Seed ✓
- ~~Fase 2~~ — Módulos CRUD del backend (themes, calendar, notes, todos, lists, finance, notifications) ✓
- **Fase 3**: Scheduler de notificaciones (cron @minuto) + Service Worker
- **Fase 4**: Angular base (layout, routing, interceptors, ThemeService, auth UI)
- **Fase 5.1–5.7**: Módulos del frontend uno por uno
- **Fase 6**: Auditoría de seguridad y pulido

Ver [`OMNIDESK_SPEC.md`](./OMNIDESK_SPEC.md) sección 10 para el roadmap completo.
