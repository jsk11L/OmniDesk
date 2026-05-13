# OmniDesk — Especificación Técnica Completa

> **Instrucciones para IA (Copilot / Claude / Cursor):**
> Actúa como Arquitecto de Software y Full-Stack Developer Senior con 15+ años de experiencia.
> Este documento es la fuente de verdad del proyecto. Genera código siguiendo CADA sección al pie de la letra.
> No introduzcas librerías, patrones ni convenciones que no estén definidos aquí.
> Ante cualquier ambigüedad, pregunta antes de asumir.

---

## Índice

1. [Visión del Producto](#1-visión-del-producto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Modelos de Base de Datos — Prisma Schema Completo](#5-modelos-de-base-de-datos)
6. [Sistema de Autenticación y Seguridad](#6-autenticación-y-seguridad)
7. [API REST — Endpoints Completos](#7-api-rest)
8. [Módulos del Frontend](#8-módulos-del-frontend)
   - 8.1 [Sistema de Diseño y UI](#81-sistema-de-diseño-y-ui)
   - 8.2 [Sistema de Temas](#82-sistema-de-temas)
   - 8.3 [Calendario](#83-calendario)
   - 8.4 [Listas](#84-listas)
   - 8.5 [Notas](#85-notas)
   - 8.6 [TO-DO](#86-to-do)
   - 8.7 [Gestión Financiera](#87-gestión-financiera)
   - 8.8 [Sistema de Notificaciones](#88-sistema-de-notificaciones)
9. [Variables de Entorno](#9-variables-de-entorno)
10. [Roadmap de Implementación — Fases](#10-roadmap-de-implementación)

---

## 1. Visión del Producto

**OmniDesk** es una aplicación web SPA (Single Page Application) de uso personal que funciona como organizador integral. Su interfaz es seria y profesional, inspirada en Notion y Obsidian: sidebar lateral fija, paleta de comandos, espacios de trabajo limpios y tipografía clara sobre fondos oscuros o claros según el tema activo.

**Alcance v1.0:**
- Calendario con vistas personalizables y eventos con notificaciones
- Listas personalizables (juegos, música, libros, etc.) con ítems enriquecidos con imagen URL
- Notas estilo Markdown/Rich Text con notificaciones
- Tablero TO-DO Kanban personalizable (uno por defecto incluido)
- Gestión financiera con dashboard (una por defecto incluida)
- Sistema de notificaciones totalmente personalizable (in-app + browser push + email)
- Sistema de temas (colores predefinidos, plantillas, creación propia)
- Backend API REST segura lista para consumir desde móvil en el futuro

**Usuario objetivo:** uso personal, un único usuario autenticado.

---

## 2. Stack Tecnológico

### 2.1 Backend

| Tecnología | Versión mínima | Propósito |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| NestJS | 10.x | Framework API REST |
| TypeScript | 5.x | Tipado estático |
| Prisma ORM | 5.x | Acceso a base de datos |
| PostgreSQL | 15+ | Base de datos principal |
| Passport.js | — | Estrategia de autenticación |
| passport-jwt | — | Estrategia JWT |
| bcrypt | — | Hash de contraseñas |
| @nestjs/jwt | — | Generación y validación de tokens |
| @nestjs/throttler | — | Rate limiting |
| @nestjs/schedule | — | Scheduler para notificaciones programadas |
| web-push | — | Notificaciones push al navegador (VAPID) |
| nodemailer | — | Envío de emails (notificaciones + verificación) |
| helmet | — | Headers de seguridad HTTP |
| class-validator | — | Validación de DTOs |
| class-transformer | — | Transformación de DTOs |
| @nestjs/config | — | Manejo de variables de entorno |

### 2.2 Frontend

| Tecnología | Versión mínima | Propósito |
|---|---|---|
| Angular | 18.x | Framework SPA |
| TypeScript | 5.x | Tipado estático |
| RxJS | 7.x | Programación reactiva |
| Tailwind CSS | 3.x | Estilos utilitarios |
| Angular Material | 18.x | Componentes UI base (modales, inputs, tablas) |
| Angular CDK | 18.x | DragDrop (Kanban/TO-DO) |
| @fullcalendar/angular | 6.x | Vista de calendario |
| @fullcalendar/daygrid | 6.x | Vista mensual del calendario |
| @fullcalendar/timegrid | 6.x | Vista semanal/diaria del calendario |
| @fullcalendar/list | 6.x | Vista lista del calendario |
| @fullcalendar/interaction | 6.x | Click e interacción en eventos |
| @tiptap/core | 2.x | Editor rich text para notas |
| @tiptap/starter-kit | 2.x | Extensiones base de TipTap |
| @tiptap/extension-image | 2.x | Soporte imágenes en editor |
| @tiptap/extension-link | 2.x | Soporte links en editor |
| chart.js | 4.x | Gráficos para gestión financiera |
| ng2-charts | 6.x | Wrapper Angular para Chart.js |
| date-fns | 3.x | Manipulación de fechas |
| ngx-toastr | 17.x | Toasts/notificaciones in-app |

### 2.3 Herramientas de Desarrollo

| Herramienta | Propósito |
|---|---|
| pnpm | Gestor de paquetes (workspace monorepo) |
| ESLint + Prettier | Linting y formateo (mismo config en ambos proyectos) |
| Jest | Tests unitarios backend |
| Karma + Jasmine | Tests frontend Angular |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Angular SPA)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Calendar  │ │  Lists   │ │  Notes   │ │ Finance/TODO │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Core: AuthInterceptor, AuthGuard            │   │
│  │         Services: HTTP → REST API                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Service Worker (notificaciones push browser)       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / REST JSON
┌─────────────────────────▼───────────────────────────────────┐
│                   BACKEND (NestJS API)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Auth    │ │ Calendar │ │  Lists   │ │ Notifications│  │
│  │  Module  │ │  Module  │ │  Module  │ │   Module     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Notes   │ │   Todo   │ │ Finance  │ │   Themes     │  │
│  │  Module  │ │  Module  │ │  Module  │ │   Module     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Scheduler: cron job cada minuto → push/email       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Prisma ORM                             │   │
│  └─────────────────────┬───────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   PostgreSQL 15+    │
              └─────────────────────┘
```

**Principios de arquitectura:**
- API REST estricta: sin lógica de presentación en el backend
- Todos los endpoints protegidos por `JwtAuthGuard` excepto `/auth/*` y rutas públicas
- Un único usuario propietario por recurso; el `userId` se extrae siempre del JWT, nunca del body
- DTOs con validación estricta en todos los endpoints de entrada
- Respuestas siempre con estructura `{ data, meta?, error? }`

---

## 4. Estructura de Directorios

```
omnidesk/
├── pnpm-workspace.yaml
├── package.json                  # root (scripts globales)
├── .env.example
├── OMNIDESK_SPEC.md              # este documento
│
├── backend/                      # Aplicación NestJS
│   ├── prisma/
│   │   ├── schema.prisma         # Fuente de verdad del schema DB
│   │   └── seed.ts               # Seed de datos por defecto
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       └── login.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/update-user.dto.ts
│   │   ├── calendar/
│   │   │   ├── calendar.module.ts
│   │   │   ├── calendar.controller.ts
│   │   │   ├── calendar.service.ts
│   │   │   └── dto/
│   │   │       ├── create-event.dto.ts
│   │   │       └── update-event.dto.ts
│   │   ├── lists/
│   │   │   ├── lists.module.ts
│   │   │   ├── lists.controller.ts
│   │   │   ├── lists.service.ts
│   │   │   └── dto/
│   │   │       ├── create-list.dto.ts
│   │   │       ├── update-list.dto.ts
│   │   │       ├── create-list-item.dto.ts
│   │   │       └── update-list-item.dto.ts
│   │   ├── notes/
│   │   │   ├── notes.module.ts
│   │   │   ├── notes.controller.ts
│   │   │   ├── notes.service.ts
│   │   │   └── dto/
│   │   │       ├── create-note.dto.ts
│   │   │       └── update-note.dto.ts
│   │   ├── todos/
│   │   │   ├── todos.module.ts
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   └── dto/
│   │   │       ├── create-board.dto.ts
│   │   │       ├── create-item.dto.ts
│   │   │       └── update-item.dto.ts
│   │   ├── finance/
│   │   │   ├── finance.module.ts
│   │   │   ├── finance.controller.ts
│   │   │   ├── finance.service.ts
│   │   │   └── dto/
│   │   │       ├── create-transaction.dto.ts
│   │   │       ├── create-budget.dto.ts
│   │   │       └── create-category.dto.ts
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.scheduler.ts  # @Cron cada minuto
│   │   │   └── dto/
│   │   │       ├── create-notification.dto.ts
│   │   │       └── push-subscription.dto.ts
│   │   ├── themes/
│   │   │   ├── themes.module.ts
│   │   │   ├── themes.controller.ts
│   │   │   ├── themes.service.ts
│   │   │   └── dto/create-theme.dto.ts
│   │   ├── mail/
│   │   │   ├── mail.module.ts
│   │   │   └── mail.service.ts
│   │   └── common/
│   │       ├── decorators/
│   │       │   └── current-user.decorator.ts
│   │       ├── filters/
│   │       │   └── http-exception.filter.ts
│   │       └── interceptors/
│   │           └── response-transform.interceptor.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                      # NO commitear
│
└── frontend/                     # Aplicación Angular 18
    ├── src/
    │   ├── main.ts
    │   ├── index.html
    │   ├── styles.scss            # variables CSS globales + Tailwind
    │   ├── manifest.webmanifest  # PWA manifest
    │   ├── sw.js                  # Service Worker para push
    │   └── app/
    │       ├── app.config.ts      # provideRouter, provideHttpClient, etc.
    │       ├── app.routes.ts      # rutas raíz
    │       ├── core/
    │       │   ├── interceptors/
    │       │   │   └── auth.interceptor.ts
    │       │   ├── guards/
    │       │   │   └── auth.guard.ts
    │       │   ├── services/
    │       │   │   ├── auth.service.ts
    │       │   │   ├── theme.service.ts
    │       │   │   └── notification-push.service.ts
    │       │   └── models/        # interfaces TypeScript globales
    │       ├── shared/
    │       │   ├── components/
    │       │   │   ├── sidebar/
    │       │   │   ├── command-palette/
    │       │   │   ├── breadcrumb/
    │       │   │   ├── image-cell/        # muestra imagen desde URL
    │       │   │   ├── tag-chip/
    │       │   │   ├── view-switcher/     # grid/tabla/galería
    │       │   │   └── confirm-dialog/
    │       │   └── pipes/
    │       │       └── safe-url.pipe.ts
    │       └── features/
    │           ├── auth/
    │           │   ├── login/
    │           │   ├── register/
    │           │   └── verify-email/
    │           ├── dashboard/
    │           ├── calendar/
    │           │   ├── calendar.component.ts
    │           │   ├── calendar.routes.ts
    │           │   ├── event-dialog/
    │           │   └── services/calendar.service.ts
    │           ├── lists/
    │           │   ├── list-home/         # todas las listas del usuario
    │           │   ├── list-detail/       # vista de una lista
    │           │   ├── list-item-dialog/
    │           │   ├── list-settings/
    │           │   └── services/lists.service.ts
    │           ├── notes/
    │           │   ├── notes-home/
    │           │   ├── note-editor/
    │           │   └── services/notes.service.ts
    │           ├── todos/
    │           │   ├── kanban-board/
    │           │   ├── item-dialog/
    │           │   └── services/todos.service.ts
    │           ├── finance/
    │           │   ├── finance-dashboard/
    │           │   ├── transaction-dialog/
    │           │   ├── budget-settings/
    │           │   └── services/finance.service.ts
    │           ├── notifications/
    │           │   ├── notification-list/
    │           │   ├── notification-editor/
    │           │   └── services/notifications.service.ts
    │           └── settings/
    │               ├── theme-editor/
    │               ├── profile-settings/
    │               └── services/settings.service.ts
    ├── angular.json
    ├── tailwind.config.js
    ├── package.json
    └── tsconfig.json
```

---

## 5. Modelos de Base de Datos

> Generar exactamente este schema en `backend/prisma/schema.prisma`.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// AUTH & USER
// ─────────────────────────────────────────

model User {
  id                  String    @id @default(uuid())
  email               String    @unique
  passwordHash        String
  displayName         String?
  avatarUrl           String?
  isEmailVerified     Boolean   @default(false)
  verificationToken   String?
  resetPasswordToken  String?
  resetPasswordExpiry DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // relaciones
  pushSubscriptions   PushSubscription[]
  calendarEvents      CalendarEvent[]
  lists               List[]
  notes               Note[]
  todoBoards          TodoBoard[]
  financeBoards       FinanceBoard[]
  notifications       NotificationConfig[]
  themes              Theme[]
  activeThemeId       String?
  activeTheme         Theme?     @relation("ActiveTheme", fields: [activeThemeId], references: [id])
}

model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────
// NOTIFICATIONS (sistema central)
// ─────────────────────────────────────────

model NotificationConfig {
  id              String              @id @default(uuid())
  userId          String
  title           String
  message         String
  iconUrl         String?             // URL del logo/icono personalizado
  accentColor     String              @default("#6366f1") // hex color
  triggerType     NotificationTrigger
  scheduledAt     DateTime?           // si triggerType = SCHEDULED
  recurringRule   String?             // cron string si isRecurring = true
  isRecurring     Boolean             @default(false)
  channels        NotificationChannel[] // array: IN_APP, PUSH, EMAIL
  isActive        Boolean             @default(true)
  isFired         Boolean             @default(false)
  lastFiredAt     DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  // referencias inversas desde otros módulos
  calendarEvents  CalendarEventNotification[]
  notes           NoteNotification[]
  inAppQueue      InAppNotification[]
}

enum NotificationTrigger {
  MANUAL       // el usuario la dispara manualmente
  SCHEDULED    // fecha/hora específica
  RECURRING    // se repite según recurringRule (cron)
}

enum NotificationChannel {
  IN_APP
  PUSH
  EMAIL
}

model InAppNotification {
  id               String             @id @default(uuid())
  userId           String
  notificationId   String
  isRead           Boolean            @default(false)
  createdAt        DateTime           @default(now())

  notification     NotificationConfig @relation(fields: [notificationId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────
// CALENDAR
// ─────────────────────────────────────────

model CalendarEvent {
  id          String    @id @default(uuid())
  userId      String
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  allDay      Boolean   @default(false)
  color       String    @default("#6366f1") // hex color del evento
  location    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user          User                       @relation(fields: [userId], references: [id], onDelete: Cascade)
  notifications CalendarEventNotification[]
}

model CalendarEventNotification {
  id               String             @id @default(uuid())
  eventId          String
  notificationId   String
  minutesBefore    Int                @default(15)

  event            CalendarEvent      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  notification     NotificationConfig @relation(fields: [notificationId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────
// LISTS (Bibliotecas enriquecidas)
// ─────────────────────────────────────────

model List {
  id               String        @id @default(uuid())
  userId           String
  name             String
  description      String?
  icon             String?       // emoji o URL de ícono
  coverImageUrl    String?       // imagen de portada (URL externa)
  defaultView      ListViewType  @default(GRID)
  defaultSortField String?       // nombre del campo por el que ordenar por defecto
  defaultSortDir   SortDirection @default(ASC)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  items   ListItem[]
  fields  ListField[]  // campos personalizados definidos para esta lista
  tags    ListTag[]    // tags predefinidos para esta lista
}

enum ListViewType {
  GRID      // tarjetas en cuadrícula
  TABLE     // tabla con columnas
  GALLERY   // imágenes grandes tipo galería
  LIST      // lista simple vertical
}

enum SortDirection {
  ASC
  DESC
}

model ListField {
  id           String          @id @default(uuid())
  listId       String
  name         String
  fieldType    ListFieldType
  isRequired   Boolean         @default(false)
  position     Int             @default(0)  // orden de la columna
  options      Json?           // para SELECT: { options: ["opción1", "opción2"] }
  defaultValue String?

  list  List       @relation(fields: [listId], references: [id], onDelete: Cascade)
  // Los valores de este campo por ítem se almacenan en ListItem.customFields (JSONB)
}

enum ListFieldType {
  TEXT
  NUMBER
  DATE
  URL
  BOOLEAN
  SELECT        // desplegable con opciones predefinidas en `options`
  MULTI_SELECT  // varios valores de `options`
  RATING        // 0-10 entero
  IMAGE_URL     // URL de imagen (se previsualiza inline)
}

model ListTag {
  id     String @id @default(uuid())
  listId String
  name   String
  color  String @default("#94a3b8") // hex

  list  List       @relation(fields: [listId], references: [id], onDelete: Cascade)
  items ListItemTag[]
}

model ListItem {
  id           String    @id @default(uuid())
  listId       String
  title        String
  imageUrl     String?   // imagen principal del ítem (URL externa)
  customFields Json      @default("{}") // { "campo_id": valor, ... }
  position     Int       @default(0)    // para ordenar manualmente
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  list List         @relation(fields: [listId], references: [id], onDelete: Cascade)
  tags ListItemTag[]
}

model ListItemTag {
  itemId String
  tagId  String

  item ListItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  ListTag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([itemId, tagId])
}

// ─────────────────────────────────────────
// NOTES
// ─────────────────────────────────────────

model Note {
  id           String    @id @default(uuid())
  userId       String
  title        String
  content      String    @default("") // JSON de TipTap o Markdown
  icon         String?   // emoji o URL
  coverImageUrl String?  // imagen de portada (URL externa)
  isPinned     Boolean   @default(false)
  tags         String[]  @default([])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user          User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  notifications NoteNotification[]
}

model NoteNotification {
  id             String             @id @default(uuid())
  noteId         String
  notificationId String

  note         Note               @relation(fields: [noteId], references: [id], onDelete: Cascade)
  notification NotificationConfig @relation(fields: [notificationId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────
// TO-DO (Kanban)
// ─────────────────────────────────────────

model TodoBoard {
  id        String      @id @default(uuid())
  userId    String
  name      String
  isDefault Boolean     @default(false)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  columns TodoColumn[]
}

model TodoColumn {
  id       String     @id @default(uuid())
  boardId  String
  name     String
  color    String     @default("#94a3b8")
  position Int        @default(0)

  board TodoBoard  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  items TodoItem[]
}

model TodoItem {
  id          String         @id @default(uuid())
  columnId    String
  title       String
  description String?
  dueDate     DateTime?
  priority    TodoPriority   @default(MEDIUM)
  tags        String[]       @default([])
  position    Int            @default(0) // orden dentro de la columna
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  column TodoColumn @relation(fields: [columnId], references: [id], onDelete: Cascade)
}

enum TodoPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

// ─────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────

model FinanceBoard {
  id        String    @id @default(uuid())
  userId    String
  name      String
  currency  String    @default("USD")
  isDefault Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories   FinanceCategory[]
  transactions Transaction[]
  budgets      Budget[]
}

model FinanceCategory {
  id           String   @id @default(uuid())
  boardId      String
  name         String
  color        String   @default("#94a3b8")
  icon         String?  // emoji o URL
  categoryType FinanceCategoryType

  board        FinanceBoard  @relation(fields: [boardId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  budgets      Budget[]
}

enum FinanceCategoryType {
  INCOME
  EXPENSE
}

model Transaction {
  id          String              @id @default(uuid())
  boardId     String
  categoryId  String?
  title       String
  amount      Float
  type        FinanceCategoryType
  date        DateTime
  notes       String?
  tags        String[]            @default([])
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  board    FinanceBoard     @relation(fields: [boardId], references: [id], onDelete: Cascade)
  category FinanceCategory? @relation(fields: [categoryId], references: [id])
}

model Budget {
  id         String         @id @default(uuid())
  boardId    String
  categoryId String?
  name       String
  amount     Float
  period     BudgetPeriod   @default(MONTHLY)
  createdAt  DateTime       @default(now())

  board    FinanceBoard     @relation(fields: [boardId], references: [id], onDelete: Cascade)
  category FinanceCategory? @relation(fields: [categoryId], references: [id])
}

enum BudgetPeriod {
  WEEKLY
  MONTHLY
  ANNUAL
}

// ─────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────

model Theme {
  id           String   @id @default(uuid())
  userId       String
  name         String
  isDefault    Boolean  @default(false) // tema del sistema, no editable
  isDark       Boolean  @default(true)
  // Colores en hex
  colorPrimary      String  @default("#6366f1") // indigo
  colorSecondary    String  @default("#8b5cf6") // violet
  colorBackground   String  @default("#0f0f0f") // fondo principal
  colorSurface      String  @default("#1a1a1a") // fondo de tarjetas/paneles
  colorSurfaceHover String  @default("#242424")
  colorBorder       String  @default("#2e2e2e")
  colorText         String  @default("#e5e5e5")
  colorTextMuted    String  @default("#71717a")
  colorAccent       String  @default("#f59e0b") // amber
  colorDanger       String  @default("#ef4444")
  colorSuccess      String  @default("#22c55e")
  fontFamily        String  @default("'Inter', sans-serif")
  borderRadius      String  @default("0.5rem")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  owner        User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  activeForUsers User[] @relation("ActiveTheme")
}
```

---

## 6. Autenticación y Seguridad

### 6.1 Flujo de Autenticación

```
1. POST /auth/register
   → bcrypt.hash(password, 12)
   → genera verificationToken (UUID)
   → guarda User con isEmailVerified: false
   → envía email con link /auth/verify?token=<token>

2. POST /auth/verify-email
   → valida verificationToken
   → isEmailVerified: true, verificationToken: null

3. POST /auth/login
   → valida email + bcrypt.compare
   → verifica isEmailVerified: true
   → devuelve { accessToken, refreshToken }
   → accessToken: JWT 15min, refreshToken: JWT 7d

4. POST /auth/refresh
   → valida refreshToken
   → devuelve nuevo accessToken

5. POST /auth/forgot-password
   → genera resetPasswordToken + resetPasswordExpiry (+1h)
   → envía email

6. POST /auth/reset-password
   → valida token y expiración
   → bcrypt.hash(newPassword)
```

### 6.2 Seguridad del Backend

| Medida | Implementación |
|---|---|
| Rate limiting global | `@nestjs/throttler`: 100 req / 15min por IP |
| Rate limiting auth | `/auth/*`: 10 req / 15min por IP |
| Helmet.js | Headers: CSP, HSTS, X-Frame-Options, etc. |
| CORS | Solo origen del frontend (`FRONTEND_URL` en env) |
| Validación DTOs | `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true` |
| userId en JWT | Nunca tomar userId del body; siempre del JWT via `@CurrentUser()` |
| Sanitización | `class-sanitizer` para campos de texto libre |
| SQL Injection | Prisma usa prepared statements por defecto |
| Passwords | bcrypt con salt rounds = 12 |
| Tokens | `crypto.randomUUID()` para tokens de verificación |

### 6.3 JWT Config

```typescript
// jwt.strategy.ts
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: '15m' },
})

// payload del accessToken
{
  sub: user.id,
  email: user.email,
  iat: ...,
  exp: ...
}
```

---

## 7. API REST

> Todos los endpoints requieren `Authorization: Bearer <accessToken>` excepto los marcados con [público].

### 7.1 Auth — `/auth`

| Método | Endpoint | Body | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, displayName? }` | `{ message: "Verification email sent" }` |
| POST | `/auth/verify-email` | `{ token }` | `{ message: "Account verified" }` |
| POST | `/auth/login` | `{ email, password }` | `{ accessToken, refreshToken }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ accessToken }` |
| POST | `/auth/forgot-password` | `{ email }` | `{ message }` |
| POST | `/auth/reset-password` | `{ token, newPassword }` | `{ message }` |
| GET | `/auth/me` | — | User object |

### 7.2 Calendario — `/calendar`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/calendar/events` | Lista todos los eventos. Query: `?start=ISO&end=ISO` |
| POST | `/calendar/events` | Crea evento |
| GET | `/calendar/events/:id` | Obtiene un evento |
| PATCH | `/calendar/events/:id` | Actualiza evento |
| DELETE | `/calendar/events/:id` | Elimina evento |
| POST | `/calendar/events/:id/notifications` | Añade notificación a evento |
| DELETE | `/calendar/events/:id/notifications/:notifId` | Elimina notificación de evento |

**CreateEventDto:**
```typescript
{
  title: string;          // required, min 1, max 200
  description?: string;
  startDate: string;      // ISO 8601
  endDate: string;        // ISO 8601; debe ser >= startDate
  allDay?: boolean;
  color?: string;         // hex color, default: colorPrimary del tema activo
  location?: string;
}
```

### 7.3 Listas — `/lists`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/lists` | Todas las listas del usuario |
| POST | `/lists` | Crea lista |
| GET | `/lists/:id` | Detalle de lista (incluye fields y tags) |
| PATCH | `/lists/:id` | Actualiza lista |
| DELETE | `/lists/:id` | Elimina lista (cascade items) |
| GET | `/lists/:id/items` | Items con filtros/búsqueda. Query: `?q=&tag=&sort=&dir=&view=` |
| POST | `/lists/:id/items` | Crea ítem |
| PATCH | `/lists/:id/items/:itemId` | Actualiza ítem |
| DELETE | `/lists/:id/items/:itemId` | Elimina ítem |
| POST | `/lists/:id/fields` | Añade campo personalizado |
| PATCH | `/lists/:id/fields/:fieldId` | Actualiza campo |
| DELETE | `/lists/:id/fields/:fieldId` | Elimina campo |
| POST | `/lists/:id/tags` | Añade tag predefinido |
| DELETE | `/lists/:id/tags/:tagId` | Elimina tag |

**CreateListItemDto:**
```typescript
{
  title: string;
  imageUrl?: string;          // URL validada con IsUrl()
  customFields?: Record<string, unknown>;  // { fieldId: value }
  tagIds?: string[];
}
```

### 7.4 Notas — `/notes`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/notes` | Lista notas. Query: `?q=&tag=&pinned=` |
| POST | `/notes` | Crea nota |
| GET | `/notes/:id` | Obtiene nota |
| PATCH | `/notes/:id` | Actualiza nota |
| DELETE | `/notes/:id` | Elimina nota |
| POST | `/notes/:id/notifications` | Añade notificación |
| DELETE | `/notes/:id/notifications/:notifId` | Elimina notificación |

### 7.5 TO-DO — `/todos`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/todos/boards` | Todos los tableros |
| POST | `/todos/boards` | Crea tablero |
| GET | `/todos/boards/:id` | Tablero con columnas e items |
| PATCH | `/todos/boards/:id` | Actualiza tablero |
| DELETE | `/todos/boards/:id` | Elimina tablero |
| POST | `/todos/boards/:id/columns` | Añade columna |
| PATCH | `/todos/boards/:id/columns/:colId` | Actualiza columna |
| DELETE | `/todos/boards/:id/columns/:colId` | Elimina columna |
| POST | `/todos/boards/:id/columns/:colId/items` | Crea item |
| PATCH | `/todos/items/:itemId` | Actualiza item (incluye mover entre columnas) |
| DELETE | `/todos/items/:itemId` | Elimina item |
| POST | `/todos/items/reorder` | Reordena items por drag & drop. Body: `{ items: [{id, columnId, position}] }` |

### 7.6 Finanzas — `/finance`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/finance/boards` | Todos los tableros financieros |
| POST | `/finance/boards` | Crea tablero |
| GET | `/finance/boards/:id` | Tablero con categorías y resumen |
| PATCH | `/finance/boards/:id` | Actualiza tablero |
| DELETE | `/finance/boards/:id` | Elimina tablero |
| GET | `/finance/boards/:id/transactions` | Query: `?start=&end=&type=&category=` |
| POST | `/finance/boards/:id/transactions` | Crea transacción |
| PATCH | `/finance/boards/:id/transactions/:txId` | Actualiza transacción |
| DELETE | `/finance/boards/:id/transactions/:txId` | Elimina transacción |
| POST | `/finance/boards/:id/categories` | Crea categoría |
| PATCH | `/finance/boards/:id/categories/:catId` | Actualiza categoría |
| DELETE | `/finance/boards/:id/categories/:catId` | Elimina categoría |
| GET | `/finance/boards/:id/summary` | Resumen: ingresos, gastos, balance, por categoría |
| POST | `/finance/boards/:id/budgets` | Crea presupuesto |
| PATCH | `/finance/boards/:id/budgets/:budId` | Actualiza presupuesto |
| DELETE | `/finance/boards/:id/budgets/:budId` | Elimina presupuesto |

### 7.7 Notificaciones — `/notifications`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/notifications` | Todas las configs de notificación del usuario |
| POST | `/notifications` | Crea configuración de notificación |
| GET | `/notifications/:id` | Obtiene configuración |
| PATCH | `/notifications/:id` | Actualiza configuración |
| DELETE | `/notifications/:id` | Elimina notificación |
| POST | `/notifications/:id/fire` | Dispara manualmente |
| GET | `/notifications/inbox` | In-app notifications no leídas |
| PATCH | `/notifications/inbox/:id/read` | Marca como leída |
| DELETE | `/notifications/inbox/clear` | Limpia todas las leídas |
| POST | `/notifications/push/subscribe` | Guarda suscripción push del navegador |
| DELETE | `/notifications/push/unsubscribe` | Elimina suscripción push |

**CreateNotificationDto:**
```typescript
{
  title: string;
  message: string;
  iconUrl?: string;           // URL validada
  accentColor?: string;       // hex color
  triggerType: 'MANUAL' | 'SCHEDULED' | 'RECURRING';
  scheduledAt?: string;       // ISO; requerido si SCHEDULED
  recurringRule?: string;     // cron string; requerido si RECURRING
  isRecurring?: boolean;
  channels: ('IN_APP' | 'PUSH' | 'EMAIL')[];
}
```

### 7.8 Temas — `/themes`

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/themes` | Todos los temas (propios + predefinidos del sistema) |
| POST | `/themes` | Crea tema personalizado |
| GET | `/themes/:id` | Obtiene tema |
| PATCH | `/themes/:id` | Actualiza tema (solo temas propios) |
| DELETE | `/themes/:id` | Elimina tema (solo temas propios) |
| PATCH | `/themes/:id/activate` | Activa el tema para el usuario |

---

## 8. Módulos del Frontend

### 8.1 Sistema de Diseño y UI

**Filosofía:** Inspirado en Notion y Obsidian. Fondo oscuro por defecto, tipografía nítida, espaciado generoso, sin bordes agresivos. Minimal pero potente.

**Layout principal:**
```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR (260px fija)  │         CONTENT AREA               │
│                        │                                     │
│  • Logo + nombre app   │  ┌─────────────────────────────┐   │
│  • Búsqueda global     │  │  Breadcrumb / Page Header   │   │
│  • Navegación:         │  └─────────────────────────────┘   │
│    - Dashboard         │                                     │
│    - Calendario        │  ┌─────────────────────────────┐   │
│    - Listas (expand.)  │  │        Vista activa         │   │
│    - Notas             │  │                             │   │
│    - TO-DO             │  │                             │   │
│    - Finanzas          │  └─────────────────────────────┘   │
│  ─────────────────     │                                     │
│  • Notificaciones (🔔) │                                     │
│  • Ajustes             │                                     │
│  • Usuario / avatar    │                                     │
└──────────────────────────────────────────────────────────────┘
```

**Paleta de comandos (Cmd+K / Ctrl+K):**
- Búsqueda global en listas, notas y eventos
- Acciones rápidas: "Nueva nota", "Nuevo evento", "Nueva lista"
- Navegación rápida entre páginas

**Componentes compartidos:**

| Componente | Descripción |
|---|---|
| `SidebarComponent` | Standalone, collapsible en mobile |
| `CommandPaletteComponent` | Modal activado por Ctrl+K |
| `BreadcrumbComponent` | Ruta actual navegable |
| `ImageCellComponent` | Renderiza URL de imagen con lazy load y fallback |
| `TagChipComponent` | Chip con color y texto, editable y eliminable |
| `ViewSwitcherComponent` | Botones para cambiar entre vista GRID/TABLE/GALLERY/LIST |
| `ConfirmDialogComponent` | Modal de confirmación reutilizable |
| `NotificationBellComponent` | Ícono con badge de no leídas en el sidebar |

### 8.2 Sistema de Temas

**Implementación:** CSS Custom Properties inyectadas dinámicamente por `ThemeService`.

```typescript
// theme.service.ts
applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.colorPrimary);
  root.style.setProperty('--color-secondary', theme.colorSecondary);
  root.style.setProperty('--color-background', theme.colorBackground);
  root.style.setProperty('--color-surface', theme.colorSurface);
  root.style.setProperty('--color-surface-hover', theme.colorSurfaceHover);
  root.style.setProperty('--color-border', theme.colorBorder);
  root.style.setProperty('--color-text', theme.colorText);
  root.style.setProperty('--color-text-muted', theme.colorTextMuted);
  root.style.setProperty('--color-accent', theme.colorAccent);
  root.style.setProperty('--color-danger', theme.colorDanger);
  root.style.setProperty('--color-success', theme.colorSuccess);
  root.style.setProperty('--font-family', theme.fontFamily);
  root.style.setProperty('--border-radius', theme.borderRadius);
  document.documentElement.setAttribute('data-theme', theme.isDark ? 'dark' : 'light');
}
```

**Temas predefinidos del sistema (seed en DB):**

| Nombre | Primario | Fondo | Modo |
|---|---|---|---|
| Obsidian Dark | `#6366f1` | `#0f0f0f` | Oscuro |
| Notion Light | `#2d2d2d` | `#ffffff` | Claro |
| Midnight Blue | `#3b82f6` | `#0d1117` | Oscuro |
| Forest | `#22c55e` | `#0f1a0f` | Oscuro |
| Sunset | `#f59e0b` | `#1a0f00` | Oscuro |

**Editor de temas (ThemeEditorComponent):**
- Color pickers para cada variable CSS
- Preview en tiempo real de la app con el tema seleccionado
- Opciones de fuente: Inter, JetBrains Mono, Merriweather, Geist
- Opciones de border-radius: Sharp (0), Soft (0.5rem), Round (1rem)
- Botón "Guardar como nuevo tema" vs "Actualizar tema"

### 8.3 Calendario

**Componente:** `CalendarComponent` usando `@fullcalendar/angular`

**Vistas disponibles:**
- `dayGridMonth`: cuadrícula mensual (por defecto)
- `timeGridWeek`: rejilla semanal con horas
- `timeGridDay`: rejilla diaria con horas
- `listWeek`: lista de eventos de la semana

**Características:**
- Drag & drop de eventos para cambiar fecha/hora (FullCalendar interaction plugin)
- Click en slot vacío abre `EventDialogComponent` con fecha preseleccionada
- Click en evento existente abre `EventDialogComponent` en modo edición
- Botón flotante "+ Evento" en la esquina inferior derecha
- Colores de eventos respetan el campo `color` de cada evento
- Filtro por color en la barra superior del calendario

**EventDialogComponent (Angular Material Dialog):**
```
┌─────────────────────────────────────────┐
│  Nuevo Evento / Editar Evento           │
│                                         │
│  Título: [____________________________] │
│  Descripción: [________________________]│
│  Fecha inicio: [date] [time]            │
│  Fecha fin:    [date] [time]            │
│  [ ] Todo el día                        │
│  Color del evento: [color picker]       │
│  Lugar (opcional): [________________]   │
│                                         │
│  Notificaciones:                        │
│  [+ Añadir notificación] ──────────────  │
│  • 15 min antes  [NotifConfig] [×]      │
│  • 1 día antes   [NotifConfig] [×]      │
│                                         │
│            [Cancelar] [Guardar]         │
└─────────────────────────────────────────┘
```

### 8.4 Listas

**ListHomeComponent:**
- Grid de tarjetas con nombre, ícono, cantidad de items y cover image
- Botón "Nueva lista" que abre un dialog de creación
- Búsqueda por nombre

**ListDetailComponent — 4 vistas:**

**Vista GRID:** Tarjetas 2-4 columnas según ancho. Cada tarjeta muestra:
- Imagen (si `imageUrl` está presente, cargada desde URL)
- Título en negrita
- Tags como chips de color
- Campos principales (configurables, máx 3 visibles)
- Menú contextual (editar, eliminar)

**Vista TABLE:** Tabla tipo spreadsheet:
- Columna title siempre fija a la izquierda
- Columnas = ListFields configurados
- Columna de imagen muestra thumbnail 40×40
- Ordenar por columna al hacer click en el header
- Inline edit al hacer click en una celda

**Vista GALLERY:** Imágenes grandes (ratio 3:4), título superpuesto abajo con gradiente. Sin imagen = placeholder con color de acento.

**Vista LIST:** Filas compactas tipo inbox. Imagen thumbnail a la izquierda, título + tags a la derecha.

**ListItemDialog:**
```
┌────────────────────────────────────────────────┐
│  Nuevo ítem / Editar ítem                      │
│                                                │
│  Título: [_________________________________]   │
│                                                │
│  URL de imagen: [_________________________]    │
│  [Preview de imagen si URL válida]             │
│                                                │
│  CAMPOS PERSONALIZADOS:                        │
│  Plataforma: [____________]  (TEXT)            │
│  Año:        [____]          (NUMBER)          │
│  Rating:     [★★★★☆]         (RATING)          │
│  Link:       [____________]  (URL)             │
│  Estado:     [▼ Completado]  (SELECT)          │
│                                                │
│  TAGS:                                         │
│  [RPG ×] [Xbox ×] [+ Añadir tag]              │
│                                                │
│                   [Cancelar] [Guardar]         │
└────────────────────────────────────────────────┘
```

**ListSettingsComponent (drawer lateral):**
- Cambiar nombre, descripción, ícono, cover image URL
- Cambiar vista por defecto
- Gestionar campos: añadir, reordenar (drag), editar tipo, eliminar
- Gestionar tags predefinidos: nombre y color
- Eliminar lista (con confirmación)

**Filtros y búsqueda (toolbar sobre la lista):**
- Input de búsqueda: filtra por título y campos TEXT/URL
- Filtro por tag: multi-select de los tags de la lista
- Filtro por campo SELECT: si algún campo es SELECT/MULTI_SELECT
- Ordenar por: cualquier campo + dirección ASC/DESC
- Todos los filtros se aplican en el frontend (sin petición extra) dado el volumen personal

### 8.5 Notas

**NotesHomeComponent:**
- Panel izquierdo: lista de notas (pinned arriba, resto cronológico descendente)
- Panel derecho: editor de nota seleccionada (o vista vacía con mensaje "Selecciona una nota")
- Búsqueda por título y contenido
- Filtro por tags
- Botón "Nueva nota" (Ctrl+N)

**NoteEditorComponent:**
- Header editable: ícono (emoji picker), cover image URL, título grande
- Editor TipTap con toolbar:
  - Negrita, Cursiva, Subrayado, Tachado
  - Heading H1/H2/H3
  - Listas ordenadas y desordenadas
  - Citas (blockquote)
  - Bloques de código
  - Links (inserta URL)
  - Imagen (inserta URL de imagen — usa `@tiptap/extension-image` configurado para src URL)
  - Divisor horizontal
- Tags editables inline (click para añadir, chip con × para eliminar)
- Toggle pin (☆/★) en la barra superior
- Menú "..." con: Añadir notificación, Eliminar nota
- Auto-save cada 2 segundos de inactividad después de editar (debounce RxJS)

### 8.6 TO-DO

**KanbanBoardComponent:**
- Columnas horizontales con scroll
- Cada columna: header editable (nombre + color + añadir ítem)
- Ítems: tarjetas con título, prioridad (badge de color), fecha límite, tags
- Drag & drop entre columnas y dentro de columna via Angular CDK
- Al soltar, llama a `POST /todos/items/reorder` con las posiciones actualizadas

**Tablero por defecto (seed):**
```
Columnas: [ Backlog | En Progreso | En Revisión | Completado ]
```

**TodoItemDialog:**
```
┌──────────────────────────────────────────────┐
│  Nueva tarea / Editar tarea                  │
│                                              │
│  Título:       [_________________________]   │
│  Descripción:  [________________________]    │
│                [________________________]    │
│  Prioridad:    [▼ Media]                     │
│  Fecha límite: [date picker]                 │
│  Columna:      [▼ En Progreso]               │
│  Tags:         [work ×] [urgent ×] [+]       │
│                                              │
│                    [Cancelar] [Guardar]      │
└──────────────────────────────────────────────┘
```

**Barra de herramientas del tablero:**
- Nombre del tablero (editable)
- Filtrar por prioridad
- Filtrar por fecha límite (hoy, esta semana, vencidos)
- Buscador de ítems
- Botón "+ Columna"
- Selector de tablero (dropdown con todos los tableros del usuario + "Nuevo tablero")

### 8.7 Gestión Financiera

**FinanceDashboardComponent — vista principal:**
```
┌──────────────────────────────────────────────────────────┐
│  [Tablero: Personal ▼]   [Enero 2025 ▼]   [+ Transacción]│
│                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │ Ingresos    │ │   Gastos    │ │      Balance        ││
│  │  $3.500     │ │  $2.100     │ │      $1.400         ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  Gráfico de      │  │  Gastos por categoría        │ │
│  │  Ingresos vs     │  │  (Donut Chart)               │ │
│  │  Gastos (línea)  │  │                              │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│                                                          │
│  Presupuestos:                                           │
│  [Alimentación  $400/$500  80% ████████░░]               │
│  [Transporte    $120/$200  60% ██████░░░░]               │
│                                                          │
│  Transacciones recientes:                                │
│  [Tabla con: Fecha | Título | Categoría | Monto | Tags]  │
└──────────────────────────────────────────────────────────┘
```

**Tablero por defecto (seed):**
- Nombre: "Finanzas Personales", currency: "USD"
- Categorías income: Salario, Freelance, Otros Ingresos
- Categorías expense: Alimentación, Transporte, Vivienda, Entretenimiento, Salud, Educación, Otros
- Presupuestos mensuales por defecto en 0 (el usuario los configura)

**TransactionDialogComponent:**
- Título, monto, tipo (Ingreso/Gasto), categoría, fecha, notas, tags

**Filtros de transacciones:**
- Rango de fechas (date range picker)
- Tipo (Ingreso / Gasto / Todos)
- Categoría (multi-select)
- Búsqueda por título

### 8.8 Sistema de Notificaciones

#### Arquitectura

```
Backend Scheduler (@Cron cada minuto)
  ↓ busca NotificationConfig donde:
    triggerType = SCHEDULED y scheduledAt <= now() y isFired = false
    OR triggerType = RECURRING y lastFiredAt es null o > un ciclo atrás
  ↓ para cada notif encontrada:
    - si channels incluye IN_APP → crea InAppNotification en DB
    - si channels incluye PUSH → web-push.sendNotification(suscripciones del usuario)
    - si channels incluye EMAIL → mail.service.sendNotificationEmail(...)
    - actualiza lastFiredAt, isFired (si SCHEDULED)
```

**Service Worker (sw.js):**
- Escucha evento `push` del browser
- Muestra `self.registration.showNotification(title, options)` con icono, badge, color body
- Opciones: `icon: iconUrl`, `badge: '/assets/icons/badge.png'`, `body: message`, `data: { url }`, `vibrate: [100, 50, 100]`

**NotificationEditorComponent — editor completo:**
```
┌──────────────────────────────────────────────────────────┐
│  Configurar Notificación                                 │
│                                                          │
│  Título:     [________________________________]          │
│  Mensaje:    [________________________________]          │
│              [________________________________]          │
│                                                          │
│  Ícono:      [URL del icono __________________] [Preview]│
│  Color:      [■ Color picker hex ______________]         │
│                                                          │
│  Tipo de disparo:                                        │
│  (●) Manual  (○) Fecha/Hora específica  (○) Recurrente   │
│                                                          │
│  [Si SCHEDULED]:                                         │
│  Fecha y hora: [datetime picker]                        │
│                                                          │
│  [Si RECURRING]:                                         │
│  Repetir:  [▼ Diariamente]                              │
│  Hora:     [__:__]                                       │
│  (Avanzado: campo cron manual)                           │
│                                                          │
│  Enviar por:  [✓] En app  [✓] Push navegador  [ ] Email  │
│                                                          │
│  Estado: [✓ Activa]                                      │
│                                                          │
│  [Disparar ahora]        [Cancelar] [Guardar]           │
└──────────────────────────────────────────────────────────┘
```

**NotificationBell (sidebar):**
- Badge con conteo de no leídas (polling cada 60s o SSE futuro)
- Click abre dropdown con lista de `InAppNotification`
- Cada notif muestra: ícono, título, mensaje (truncado), tiempo relativo
- Botón "Marcar todas como leídas"
- Link "Ver todas" → `/notifications/inbox`

---

## 9. Variables de Entorno

### Backend (`backend/.env`)

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/omnidesk"

# JWT
JWT_SECRET="cambiar_por_string_aleatorio_64_chars"
JWT_REFRESH_SECRET="cambiar_por_otro_string_aleatorio_64_chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:4200"

# Email (Nodemailer con SMTP o Resend)
MAIL_HOST="smtp.resend.com"
MAIL_PORT=465
MAIL_USER="resend"
MAIL_PASS="re_xxxxxxxxxxxx"
MAIL_FROM="noreply@omnidesk.app"

# Web Push (VAPID keys — generar con: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="xxxxxxxxxxxx"
VAPID_PRIVATE_KEY="xxxxxxxxxxxx"
VAPID_SUBJECT="mailto:admin@omnidesk.app"
```

### Frontend (`frontend/.env` o `environment.ts`)

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  vapidPublicKey: 'xxxxxxxxxxxx', // mismo VAPID_PUBLIC_KEY del backend
};
```

---

## 10. Roadmap de Implementación

### Fase 1 — Fundación (Backend)

**Objetivo:** API funcional con autenticación y DB lista.

1. Inicializar monorepo con `pnpm-workspace.yaml`
2. Crear proyecto NestJS en `backend/`
3. Configurar Prisma con `schema.prisma` completo (sección 5)
4. `npx prisma migrate dev --name init`
5. Configurar `app.module.ts`: ConfigModule, ThrottlerModule, ScheduleModule, HelmetMiddleware
6. Implementar `auth/` completo: registro, verificación email, login, refresh, forgot/reset password
7. Implementar `mail/` con Nodemailer
8. `ValidationPipe` global + `ResponseTransformInterceptor` global
9. Implementar `seed.ts` para: temas predefinidos, tablero TO-DO por defecto, tablero financiero por defecto

**Prompt para ejecutar esta fase:**
> "Fase 1 (Fundación Backend): Implementa todo lo descrito en la sección 10 — Fase 1 del documento OMNIDESK_SPEC.md. Incluye el schema Prisma completo de la sección 5 y el módulo auth completo de la sección 6."

---

### Fase 2 — Módulos Backend CRUD

**Objetivo:** Todos los endpoints REST funcionando.

1. Módulo `calendar/` — CRUD eventos + relación con notificaciones
2. Módulo `lists/` — CRUD listas, items, fields, tags
3. Módulo `notes/` — CRUD notas + relación con notificaciones
4. Módulo `todos/` — CRUD tableros, columnas, items + endpoint reorder
5. Módulo `finance/` — CRUD tableros, categorías, transacciones, presupuestos, endpoint summary
6. Módulo `notifications/` — CRUD configs, inbox, push subscribe/unsubscribe
7. Módulo `themes/` — CRUD temas + endpoint activate

**Prompt para ejecutar esta fase:**
> "Fase 2 (Módulos CRUD): Genera todos los módulos NestJS (calendar, lists, notes, todos, finance, notifications, themes) con sus controladores, servicios y DTOs exactamente según la sección 7 de OMNIDESK_SPEC.md. Protege todos los endpoints con JwtAuthGuard. Extrae siempre el userId del JWT usando el decorator @CurrentUser()."

---

### Fase 3 — Scheduler de Notificaciones

**Objetivo:** Notificaciones push y email funcionando automáticamente.

1. `notifications.scheduler.ts` con `@Cron(CronExpression.EVERY_MINUTE)`
2. Consulta notificaciones SCHEDULED pendientes y RECURRING que deben ejecutarse
3. Para IN_APP: inserta en `InAppNotification`
4. Para PUSH: `web-push.sendNotification()` a todas las suscripciones del usuario
5. Para EMAIL: `mail.service.sendNotificationEmail()`
6. Service Worker básico en el frontend para recibir push

**Prompt para ejecutar esta fase:**
> "Fase 3 (Scheduler): Implementa notifications.scheduler.ts con @Cron cada minuto según la lógica descrita en la sección 8.8 de OMNIDESK_SPEC.md. Usa web-push para PUSH, mail.service para EMAIL, e inserta en InAppNotification para IN_APP."

---

### Fase 4 — Frontend Base

**Objetivo:** Angular configurado con layout, routing y autenticación.

1. Crear proyecto Angular 18 en `frontend/`
2. Configurar Tailwind CSS + Angular Material + `styles.scss` con CSS custom properties
3. `app.config.ts`: provideRouter (lazy routes), provideHttpClient with interceptors, provideAnimations
4. `auth.interceptor.ts`: añadir Bearer token a todas las peticiones
5. `auth.guard.ts`: redirigir a `/auth/login` si no hay token
6. `app.routes.ts`: rutas raíz con lazy loading de features
7. `SidebarComponent` + layout principal con router-outlet
8. `ThemeService`: aplica CSS custom properties al cargar app y al cambiar tema
9. Features `auth/` completas: Login, Registro, Verificación
10. `CommandPaletteComponent` activado por Ctrl+K

**Prompt para ejecutar esta fase:**
> "Fase 4 (Frontend Base): Configura el proyecto Angular 18 completo con Tailwind, Angular Material, routing lazy, AuthInterceptor, AuthGuard, SidebarComponent, y ThemeService según la sección 8.1, 8.2 y estructura de directorios de OMNIDESK_SPEC.md."

---

### Fase 5 — Módulos Frontend por Iteración

Ejecutar uno por vez, en este orden:

1. **Calendario** — integración FullCalendar + EventDialog + notificaciones de evento
   > "Fase 5.1: Genera el módulo Calendario completo según sección 8.3 de OMNIDESK_SPEC.md."

2. **Listas** — home, detail con 4 vistas, ListItemDialog, ListSettings
   > "Fase 5.2: Genera el módulo Listas completo según sección 8.4 de OMNIDESK_SPEC.md."

3. **Notas** — layout 2 paneles + editor TipTap + auto-save
   > "Fase 5.3: Genera el módulo Notas completo según sección 8.5 de OMNIDESK_SPEC.md."

4. **TO-DO** — Kanban con DragDrop CDK + dialog
   > "Fase 5.4: Genera el módulo TO-DO Kanban completo según sección 8.6 de OMNIDESK_SPEC.md."

5. **Finanzas** — dashboard + gráficos Chart.js + dialog de transacciones
   > "Fase 5.5: Genera el módulo Gestión Financiera completo según sección 8.7 de OMNIDESK_SPEC.md."

6. **Notificaciones** — editor completo + inbox + push registration
   > "Fase 5.6: Genera el módulo Notificaciones completo según sección 8.8 de OMNIDESK_SPEC.md."

7. **Ajustes** — ThemeEditor + perfil de usuario
   > "Fase 5.7: Genera el módulo Ajustes completo con ThemeEditorComponent según sección 8.2 de OMNIDESK_SPEC.md."

---

### Fase 6 — Pulido y Seguridad

1. Revisar todos los endpoints: verificar que `userId` nunca se toma del body
2. Tests E2E básicos de auth y CRUD principal
3. Configurar CSP estricto en Helmet (whitelist solo el origen del frontend)
4. Verificar rate limiting en endpoints de auth
5. Auditar que `imageUrl` y `iconUrl` solo aceptan URLs HTTP/HTTPS válidas (no data URIs, no javascript:)
6. Revisar que los campos JSONB (`customFields`) se saniticen antes de persistir
7. Configurar HTTPS en producción (certificado Let's Encrypt o proxy Nginx)

---

*Documento generado el 2026-05-12. Versión 1.0.*
*Actualizar este documento antes de comenzar cada fase para reflejar cambios de alcance.*
