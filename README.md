# OmniDesk Web

Organizador personal integral en una sola SPA: calendario, listas tipo biblioteca, notas con editor rich-text, tablero Kanban TO-DO, gestión financiera, notificaciones (in-app, push del navegador y email) y temas totalmente personalizables.

Pensado para uso personal: una única cuenta por instalación, sin colaboración multiusuario, autohospedable de extremo a extremo.

---

## Funcionalidades

- **Calendario** — vistas mensual, semanal, diaria y de agenda; eventos all-day o con rango; recordatorios programables por evento con notificación push y/o email.
- **Listas** — bibliotecas personalizadas (juegos, libros, música, películas, lo que quieras) con campos definibles por el usuario, tags coloreadas, cover images por ítem (vía URL) y vistas grilla o tabla.
- **Notas** — editor TipTap con autoguardado debounced cada 2 segundos, soporte de imágenes y links, pin de notas favoritas, búsqueda en tiempo real y atajo `Ctrl+N` para nueva nota.
- **TO-DO Kanban** — tablero con columnas configurables, drag & drop entre columnas (Angular CDK), reordenamiento de items, dueDate y prioridad por tarjeta.
- **Finanzas** — múltiples boards (cuentas), categorías de ingreso/egreso, presupuestos por categoría, transacciones recurrentes opcionales, dashboard con gráficos de balance y composición (Chart.js).
- **Notificaciones** — tres canales: bandeja in-app, push del navegador (Web Push API + VAPID) y email (Nodemailer). Reglas con `recurringRule` estilo cron, evaluadas por un scheduler que corre cada minuto.
- **Temas** — 5 temas predefinidos (Obsidian Dark, Notion Light, Midnight Blue, Forest, Sunset) más temas personalizados ilimitados; cada color, fuente y radio de borde se mapea a CSS custom properties inyectadas en `:root`.
- **Command palette** — abrir con `Ctrl+K` desde cualquier vista para navegar rápido entre módulos.

---

## Stack técnico

**Backend** (NestJS 10 standalone modules)
- TypeScript estricto, Prisma 5 + PostgreSQL 18
- Passport JWT (access + refresh) con bcrypt 12 rounds
- `class-validator` con DTOs estrictos en TODOS los endpoints (`whitelist: true`, `forbidNonWhitelisted: true`)
- `@nestjs/throttler` con rate limit global 100/15min y `/auth/*` reducido a 10/15min
- `@nestjs/schedule` con `@Cron(EVERY_MINUTE)` para evaluar y disparar notificaciones
- `web-push` con VAPID para push del navegador
- `nodemailer` con fallback a modo consola si el host SMTP es el placeholder
- Helmet con CSP estricta (`default-src 'none'`), HSTS en producción, CORS con validador funcional
- Sanitización de JSONB contra prototype pollution (caps de profundidad, keys, arrays, strings)

**Frontend** (Angular 18 standalone components)
- Signals + `computed()` + nuevo control flow (`@if` / `@for` / `@switch` / `@let`)
- `ChangeDetectionStrategy.OnPush` en todos los componentes
- Tailwind CSS sobre CSS custom properties (los temas re-pintan toda la app sin recompilar)
- Angular Material Dialog para modales, `@angular/cdk` DragDrop para Kanban
- FullCalendar 6 (dayGrid + timeGrid + list + interaction)
- TipTap 2 (StarterKit + Image + Link) con autoguardado vía RxJS `Subject + debounceTime`
- Chart.js 4 + `ng2-charts` 6 para gráficos del dashboard de finanzas
- `ngx-toastr` para feedback de errores y éxitos
- Service Worker propio (`sw.js`) para recibir push del navegador

**Infraestructura**
- Monorepo `pnpm workspace` (raíz + `backend` + `frontend`)
- Node.js 20 LTS, PostgreSQL 18

---

## Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                    Angular 18 SPA                    │
│   Auth · Calendar · Lists · Notes · Todos · Finance  │
│         Notifications · Settings · Themes            │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP (JWT en Authorization)
                       │ Web Push (VAPID)
                       ▼
┌──────────────────────────────────────────────────────┐
│              NestJS 10 — REST API                    │
│  AuthGuard → DTO validation → Service → Prisma → DB  │
│                                                      │
│  + @Cron(EVERY_MINUTE) scheduler:                    │
│    evalúa NotificationConfig vencidas,               │
│    crea InAppNotification, manda push y email        │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
                  PostgreSQL 18
                  (21 modelos Prisma)
```

Todas las respuestas REST tienen forma `{ data, meta?, error? }`. El `userId` siempre se extrae del JWT vía decorator `@CurrentUser()`, NUNCA del body de la request. Las imágenes son SIEMPRE strings URL validados con `@IsUrl()` — el servidor no acepta uploads de archivos.

---

## Estructura del repo

```
.
├── backend/                  Aplicación NestJS
│   ├── prisma/               schema.prisma (21 modelos) + seed.ts (5 temas)
│   ├── src/
│   │   ├── auth/             Register, verify-email, login, refresh, me
│   │   ├── users/            PATCH /users/me
│   │   ├── themes/           CRUD + activate
│   │   ├── calendar/         Eventos + recordatorios
│   │   ├── notes/            CRUD + adjuntar notificaciones
│   │   ├── todos/            Boards, columnas, items, reorder
│   │   ├── lists/            Lists + items + fields + tags
│   │   ├── finance/          Boards, transactions, categories, budgets, summary
│   │   ├── notifications/    CRUD, scheduler, push subscriptions, inbox
│   │   ├── mail/             Nodemailer con fallback consola
│   │   ├── prisma/           PrismaService global
│   │   └── common/           Filters, interceptors, decorators, utils
│   └── test/                 Tests E2E (auth + themes)
└── frontend/                 Aplicación Angular 18
    ├── src/app/
    │   ├── core/             Auth guard, interceptor, services, models
    │   ├── shared/           main-layout, sidebar, command palette, dialogs
    │   └── features/         Un módulo por dominio (auth, calendar, lists, …)
    ├── src/sw.js             Service worker para push
    └── src/styles.scss       Tailwind + CSS custom properties
```

---

## Requisitos

- Node.js 20 LTS
- pnpm 9+ (preferentemente vía `corepack enable && corepack prepare pnpm@latest --activate`)
- PostgreSQL 18 (local, Docker o gestionado)
- Un cliente Postgres para crear la base manualmente (pgAdmin 4, DBeaver, `psql`, etc.)

---

## Uso

Una vez instalado y configurado (la guía paso a paso de instalación local no se publica en este repo), el flujo es:

1. **Registro** en `/auth/register`. Se envía un email de verificación (o se imprime por consola si no configuraste SMTP real).
2. **Verificar email** con el token recibido — el servidor exige email verificado para hacer login.
3. **Login** → se obtienen `accessToken` (15 min) y `refreshToken` (7 días).
4. **Dashboard** con accesos rápidos a los 6 módulos. `Ctrl+K` abre la paleta de comandos.
5. **Settings → Theme editor** para crear tu propio tema o activar uno de los 5 predefinidos.
6. **Settings → Profile** para cambiar displayName, password o suscribirte a push del navegador.

El scheduler corre dentro del mismo proceso NestJS — no necesitas un cron externo.

---

## Estado del proyecto

Versión 1.0 según especificación interna. Las 6 fases del roadmap están completas:

| Fase | Alcance | Estado |
|------|---------|:------:|
| F1   | Monorepo + NestJS scaffold + Prisma schema + Auth + Seed | ✅ |
| F2   | 7 módulos CRUD backend (themes, calendar, notes, todos, lists, finance, notifications) | ✅ |
| F3   | Scheduler de notificaciones + service worker base | ✅ |
| F4   | Angular 18 base: auth, theme service, sidebar, command palette | ✅ |
| F5   | 7 módulos frontend completos | ✅ |
| F6   | Auditoría de seguridad, sanitización JSONB, helmet CSP estricta, tests E2E | ✅ |

Tests E2E del backend cubren el flujo completo de autenticación (register → verify → login → refresh → me) y el CRUD de temas incluyendo protecciones (sin token, hex inválido, whitelist DTO, system themes read-only, clear de `activeThemeId` al borrar).

---

## Licencia

[MIT](./LICENSE).
