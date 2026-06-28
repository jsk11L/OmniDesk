# OmniDesk Android · Master Roadmap

**Version:** 1.0
**Date:** May 2026
**Language:** English (the app, code and UI, will be in English from day one)
**Scope:** Android native app for OmniDesk. iOS is explicitly out of scope (see §1.4).

---

## Table of contents

- [§0 · How to read this document](#0--how-to-read-this-document)
- [§1 · Vision and principles](#1--vision-and-principles)
- [§2 · Current state](#2--current-state)
- [§3 · Architecture](#3--architecture)
- [§4 · Roadmap by blocks](#4--roadmap-by-blocks)
- [§5 · Backend changes required](#5--backend-changes-required)
- [§6 · Test plan](#6--test-plan)
- [§7 · MVP Definition of Done](#7--mvp-definition-of-done)
- [§8 · Post-MVP](#8--post-mvp)
- [§9 · Decision log](#9--decision-log)
- [§10 · Developer setup appendix](#10--developer-setup-appendix)

---

# §0 · How to read this document

This is the **master document for the OmniDesk Android app**. It is a sibling of `ROADMAP.md` (the web app's roadmap), located in `OmniDesk/android/ROADMAP_ANDROID.md`. Both documents share the project's vision and principles but address different surfaces.

## 0.1 · Relationship with ROADMAP.md (web)

The web roadmap (`OmniDesk/ROADMAP.md`) is the authoritative source for:

- Project vision, mission, principles (§1).
- Backend architecture, data model, API contracts (§3).
- Backend operational requirements (§5).
- Cross-cutting decisions registered as D-001 through D-026 (and onwards).

This document (`ROADMAP_ANDROID.md`) is the authoritative source for:

- Android app architecture and stack.
- Android-specific roadmap blocks.
- Android tests, deployment, store submission.
- Android-specific decisions registered as D-AND-001 onwards (separate numbering to avoid collision with web decisions).

**When in conflict:** the web roadmap's principles and vision (§1) take precedence. Architecture and roadmap blocks are local to each document.

## 0.2 · When to read which document

- **Designing or modifying backend behavior** → `ROADMAP.md` web first, this doc second (for app-specific implications).
- **Designing or modifying Android UX** → this doc, with reference to web for parity.
- **Adding a new feature to the project** → both docs need updating: spec in web roadmap if it affects backend, implementation plan in Android roadmap.
- **Resolving a cross-cutting question (security, data model, etc.)** → check web `§9` decision log first; if app-specific, register in this doc's `§9` as `D-AND-XXX`.

## 0.3 · Conventions used here

- **D-XXX** — refers to a web decision (in `ROADMAP.md` §9).
- **D-AND-XXX** — refers to an Android decision (in this doc §9).
- **B-AND-X** — refers to a block of this document's roadmap (§4).
- **🆕** — element to be built.
- **⚠️ PENDING DECISION** — needs resolution before implementation (none should remain unresolved when this doc is committed).

## 0.4 · Day-to-day use

When starting a roadmap block:

1. Open §4, find the block.
2. Read acceptance criteria carefully.
3. Cross-check §9 for active decisions in scope.
4. If a new decision arises during implementation, register it before continuing.
5. Implement.
6. Mark checks in §7 as features close.

When the backend needs changes to support the app:

1. Document in §5 what change is required.
2. Apply it in the backend (cross-update web `ROADMAP.md` §9 if it's a new web decision).
3. Then consume from the app.

## 0.5 · This document is alive

Same rule as the web roadmap: any significant change is committed with a message explaining what changed and why. History is preserved through deprecation, not deletion.

---

# §1 · Vision and principles

> This section defines **what the Android app is, what it isn't, and which mobile-specific principles guide it**. Most of OmniDesk's vision (the eight principles in `ROADMAP.md` §1.2) applies directly — this section adds what's specific to mobile.

## 1.1 · What the Android app is

The Android app is **the OmniDesk experience adapted natively to Android**. Same eight modules as web (notes, calendar, lists, todos, habits, finance, finance organizer, notifications, themes), same backend, same user account, same data. Different surface: optimized for Android conventions, gestures, and capabilities.

It is **three things simultaneously**:

### (B) The Android client of the public instance at omnidesk.app

The user who created an account on the web instance opens the Android app, logs in, and finds their data exactly as it is on the web. This is the primary purpose.

### (C) The author's daily mobile companion

The author uses the Android app on their phone for the moments where the web isn't viable: quick capture of a thought while away from the desk, marking a habit done, capturing an expense receipt, checking the day's agenda. **Dogfooding is mandatory** — if the app isn't worth opening daily on the author's phone, it isn't ready.

### (A) MIT open-source, forkable

Anyone can clone the monorepo and build the Android app for their own backend. The app's `BACKEND_URL` is configurable at build time and at runtime (settings → "Custom backend"), so forks point their app at their own instance.

### What the Android app is **not**

- **Not iOS.** iOS is explicitly out of scope. (D-AND-001).
- **Not a parallel product with its own feature set.** Feature parity with web is mandatory (D-AND-002). The app does what the web does, not less, not more — just adapted to mobile context.
- **Not a thin web wrapper.** No WebView, no PWA wrapper, no React Native. Native Kotlin + Jetpack Compose throughout. (D-AND-003).
- **Not offline-first.** Online-first with read cache and bounded offline creation. No two-way sync, no conflict resolution. (D-AND-004).
- **Not a collaboration tool.** Same anti-goal as web — no shared accounts, no shared workspaces.

## 1.2 · Mobile-specific principles

The web's principles (`ROADMAP.md` §1.2) apply in full. These are additions specific to Android:

### Principle A1 · Native feel, native performance

- The app uses **Jetpack Compose**, **Material 3**, and follows Android's design conventions. Not iOS-style, not "look unique" — Android-style.
- **No frame drops.** Lists with hundreds of items scroll at 60-120fps. The app feels solid.
- Animations follow Material motion guidelines: present, purposeful, never gratuitous.
- Gestures match user expectations: swipe to delete, pull to refresh, long-press for context menu.

### Principle A2 · Mobile context drives priorities

The web is for long-form work. The app is for moments. Design priorities reflect this:

- **Quick capture** is one tap from app launch: floating action button, voice note shortcut.
- **Reading recent content** is the default home view: today's events, today's habits, recent notes.
- **Heavy editing** (configuring list custom fields, designing budgets) is possible but de-emphasized — assume the user does that on web.
- **Notifications** are first-class. They're how the user comes back to the app most often.

### Principle A3 · Online-first with graceful degradation

- The app **assumes** network availability and is fastest when online.
- Without network: cached content is browsable (read), bounded creation is allowed (write).
- Loss of network mid-action: clear toast, no silent failure, no false success.
- Recovery of network: pending creations sync automatically, with subtle confirmation.

### Principle A4 · Battery and data respect

- **Background sync is bounded.** WorkManager with constraints (network required, not idle-only).
- **Push notifications are the primary background mechanism.** No polling.
- **Image loading is lazy and cached.** Coil with disk cache, never refetch what's local.
- **Telemetry is minimal.** Only Sentry for crashes (D-AND-005). No analytics, no usage tracking.

### Principle A5 · Privacy on-device where possible

- **Voice notes** transcribed via Android's on-device `SpeechRecognizer` when available, falling back to backend only when on-device fails (D-AND-006).
- **Camera captures** processed locally before upload (compression, optional cropping). The raw photo never leaves the device unless the user explicitly uploads.
- **Cached content is encrypted at rest** when the device supports it (EncryptedSharedPreferences + Room with SQLCipher post-MVP).

### Principle A6 · Defaults that respect the user

- **Notification permission is requested when there's value to show**, not at first launch (Android 13+ best practice).
- **No nagging for ratings, reviews, or subscriptions.** Ever.
- **No ads.** Same as web.
- **No tracking SDKs.** Sentry is the only third-party crash-reporting service.

## 1.3 · Mobile definition of success

The Android app is successful when:

1. **The author uses it daily** on their personal phone, not as a "test the app I'm building" gesture but as a real organizer for mobile moments.
2. **At least 5 users on the public instance** have downloaded and use the Android app, having registered through it or migrated from web.
3. **Crash-free session rate ≥99%** on Sentry over 30 days.
4. **Cold-start time <2s** on a mid-tier device (Pixel 6a equivalent).
5. **The app appears in the Play Store** under the name OmniDesk, with screenshots, description, privacy policy linked, and proper categorization.

This is **not** a download-count goal or a rating goal. It's validation that the app works for its three audiences (B, C, A).

## 1.4 · Explicit anti-goals (Android-specific)

- **No iOS.** Permanent. The author does not have a Mac. (D-AND-001).
- **No tablet-specific UI.** The app works on tablets (Compose adapts layout) but no special tablet treatment. (D-AND-007).
- **No Wear OS, Android Auto, or Android TV.** Out of scope.
- **No Google Sign-In, Facebook Sign-In, or social auth.** Email + password only, same as web.
- **No in-app purchases.** No subscriptions, no premium features, no consumables. The app is free, full-featured, ad-free.
- **No analytics SDKs.** No Firebase Analytics, no Mixpanel, no Amplitude. Only Sentry for crashes.
- **No real-time collaboration.** Same as web — explicit anti-goal of OmniDesk.

## 1.5 · Decisions registered in this section

Cross-reference with §9 for full context:

| # | Decision | Justification |
|---|----------|---------------|
| D-AND-001 | Android-only, no iOS | Author lacks Mac; macOS required for Xcode |
| D-AND-002 | Feature parity with web mandatory | Mobile is a surface, not a separate product |
| D-AND-003 | Native Kotlin + Compose, no cross-platform | Best fit for OmniDesk quality bar |
| D-AND-004 | Online-first + bounded offline creation | Eliminates sync conflicts |
| D-AND-005 | Sentry only for telemetry | Privacy principle of OmniDesk |
| D-AND-006 | On-device speech recognition with backend fallback | Privacy + low latency |
| D-AND-007 | No tablet-specific UI in MVP | Scope discipline |

---

# §2 · Current state

> This section is a **realistic starting point assessment**. Unlike the web roadmap where there was substantial existing code, the Android app starts at zero. But the backend, schemas, and shared types from the web project are partially reusable — this section audits what's ready and what needs adaptation for mobile.

## 2.1 · Executive summary

**Android app code:** 0 lines. Starting from scratch.

**Backend reusability:** ~85% of the existing backend works as-is for the app. The Android app consumes the same REST endpoints that the web frontend uses. The 15% that needs change is documented in §5 and consists primarily of:

- Accepting client-proposed UUIDs on creation endpoints (for offline creation support).
- Adding FCM device token registration endpoints.
- Adding endpoints for app-specific metadata (e.g., last sync timestamp).
- Minor refinements to push notification payloads (deep link target).

**Shared types:** the `shared/` package (Zod schemas generated from Prisma) is **not directly consumable from Kotlin**. We will reimplement the contracts in Kotlin as data classes (with manual parity discipline). Alternative considered: generate Kotlin types from OpenAPI spec (post-MVP if needed).

**Backend operational readiness:** the web's deployment is single-instance, with public registration, captcha, T&C, 2FA TOTP. The app consumes this as-is. No changes to deployment topology.

## 2.2 · Backend reusability audit

For each module, what the app needs from the backend, and the status:

| Module | Endpoints needed | Ready? | Changes required |
|--------|------------------|--------|------------------|
| Auth (login, register, refresh, 2FA) | `/auth/*` | ✅ | None |
| User (me, update, delete) | `/users/me` | ✅ | None |
| Themes | `/themes` | ✅ | None |
| Calendar (events, settings) | `/calendar/*` | ⚠️ | Accept client-proposed UUIDs on POST |
| Lists (lists, items, fields, tags) | `/lists/*` | ⚠️ | Accept client-proposed UUIDs on POST |
| Notes | `/notes/*` | ⚠️ | Accept client-proposed UUIDs on POST |
| TODO kanban | `/todos/*` | ⚠️ | Accept client-proposed UUIDs on POST |
| Habits | `/habits/*` | ⚠️ | Accept client-proposed UUIDs on POST |
| Finance | `/finance/*` | ⚠️ | Accept client-proposed UUIDs on POST |
| Notifications | `/notifications/*` | ⚠️ | Add FCM device token endpoints |
| Uploads | `/uploads` | ✅ | None |
| Dashboard | `/dashboard` | ✅ | None |
| Search | `/search` | ✅ | None (built in web roadmap block B7) |
| Export | `/export/all`, `/notes/:id/export.md` | ✅ | None |
| Import | `/import/*` | ⚠️ | Not used from app in MVP; post-MVP |

**The "Accept client-proposed UUIDs" change is a single cross-cutting refactor** — see §5.1.

## 2.3 · What the backend doesn't yet provide

These need to be built specifically for the app, listed in §5 in detail:

- `POST /devices/register` — register an FCM device token to the current user.
- `DELETE /devices/:id` — unregister a device.
- `GET /devices` — list user's registered devices (with names, last activity).
- Push notification payload includes `deepLink` field pointing to entity (e.g., `omnidesk://notes/abc-123`).
- `GET /sync/snapshot` — for initial population of app cache after first login (post-MVP optimization; MVP uses per-module fetches).

## 2.4 · What's deliberately NOT reused

- **Angular code.** Different paradigm. Reimplementing UI from scratch in Compose.
- **Material UI components.** Angular Material ≠ Material 3 in Compose. Different library, same design language.
- **FullCalendar, TipTap, Chart.js, ngx-toastr.** All web-only. We use Android-native equivalents (see §3.1).
- **CSS variables theming.** Compose has its own theming system. The 12 system themes from web are reimplemented as Compose `ColorScheme` objects.

## 2.5 · Tooling state

| Tool | Status | Action |
|------|--------|--------|
| Android Studio | Not installed | Install per §10 |
| JDK | Not installed (or system Java) | Android Studio installs JDK 21 automatically |
| Gradle | Bundled with Android Studio | None |
| Git | Already installed | None |
| Google Play Console | Not registered | Register before Block 6 |
| Firebase project | Not created | Create in Block 4 (push notifications) |
| Sentry account | Not created | Create in Block 5 |

See §10 for the full developer setup walkthrough.

## 2.6 · Summary for roadmap planning

The Android app's roadmap doesn't have a "fix existing bugs" block (Block 0 in web). Instead, Block 0 is "developer setup + project scaffolding". The order of subsequent blocks reflects:

1. **Foundation** (project structure, networking, cache, auth) before features.
2. **Sync engine** before any module — every module depends on it.
3. **Modules in order of value to mobile usage**: notes, calendar, todos, habits first; lists and finance later (heavier UI).
4. **Mobile-specific features** (camera, voice notes, push, share) after core modules work.
5. **Polish** (animations, accessibility, performance) before store submission.
6. **Play Store submission** as final gate.

§4 details this.

---

# §3 · Architecture

> This section documents **the firm technical decisions** for the Android app. Like the web's §3, this is "what and why", not implementation manual.

## 3.1 · Technology stack

### Language and frameworks

- **Kotlin 2.0+** with K2 compiler.
- **Jetpack Compose** (BOM 2024.10+) — UI toolkit. No XML layouts, no Views except where unavoidable.
- **Material 3** (`androidx.compose.material3`) — design system.
- **Compose Navigation** (`androidx.navigation:navigation-compose`) — screen navigation.

### Architecture pattern

- **MVVM with unidirectional data flow** — ViewModels expose `StateFlow<UiState>`, Composables collect and render. Events flow up via callbacks.
- **Clean architecture loose interpretation**: `data/` (repositories, API, DB) → `domain/` (use cases, business rules) → `ui/` (Compose screens, ViewModels). Pragmatic; no rigid layer enforcement for trivial CRUD.
- **Dependency injection: Hilt** (`com.google.dagger:hilt-android`). Generated DI graph, less boilerplate than manual Dagger.

### Persistence and cache

- **Room 2.6+** — local SQLite cache for offline reads and pending-sync entities.
- **DataStore Preferences** — for app settings, last sync timestamp, feature flags.
- **EncryptedSharedPreferences** (from `androidx.security:security-crypto`) — for JWT tokens, refresh tokens, 2FA backup codes. Keystore-backed.

### Networking

- **Retrofit 2.11+** with `OkHttp 4.12+`.
- **Kotlinx Serialization** (`kotlinx-serialization-json`) — JSON parsing. Compile-time, no reflection. Idiomatic Kotlin.
- **OkHttp interceptors** for: JWT injection, automatic refresh on 401, retry with exponential backoff on 5xx, logging in debug builds.

### Async

- **Kotlin Coroutines + Flow** — async operations and reactive streams. Standard for Android in 2026.

### Background work

- **WorkManager 2.10+** — for: pending sync push, periodic cache cleanup, scheduled habit reminders backup.
- **Firebase Cloud Messaging (FCM)** — push notifications.

### Images

- **Coil 2.7+** — image loading with disk and memory cache. Compose-native (`AsyncImage`).

### Camera and media

- **CameraX 1.4+** (`androidx.camera`) — camera capture for notes and wishlist items.
- **Media3** (`androidx.media3:media3-exoplayer`) — voice note playback. ExoPlayer-based.
- **MediaRecorder** + **SpeechRecognizer** (Android system) — voice note recording and on-device transcription.

### Rich text editing

- **Compose Rich Editor** (`com.mohamedrejeb.richeditor:richeditor-compose`) — Markdown-compatible rich text editor in Compose. Closest equivalent to TipTap for our use case. (D-AND-008).

### Calendar UI

- **Calendar Compose** (`com.kizitonwose.calendar:compose`) — calendar grid component. Month, week, year views.

### Charts

- **Vico** (`com.patrykandpatrick.vico:compose-m3`) — charts in Compose. Used in finance dashboards.

### Drag and drop

- **Reorderable Compose** (`sh.calvin.reorderable:reorderable`) — drag-to-reorder lists. For kanban columns and items.

### TOTP for 2FA

- **OTP Java** (`com.github.bastiaanjansen:otp-java`) — TOTP code generation and verification on client. (For 2FA verification display, not for replacing backend.)
- **ZXing** (`com.google.zxing:core` + `com.journeyapps:zxing-android-embedded`) — QR code generation for displaying 2FA setup, and scanning if user transfers from another authenticator.

### Crash reporting

- **Sentry SDK for Android** (`io.sentry:sentry-android` + `io.sentry:sentry-android-okhttp`).

### Logging

- **Timber** (`com.jakewharton.timber:timber`) — wraps `Log` with cleaner API, easy to disable in release.

### Testing

- **JUnit 5** — unit tests.
- **MockK** — mocking in Kotlin.
- **Turbine** — testing Flow.
- **Compose UI Test** — UI tests.
- **Espresso** (sparingly) — for system interactions Compose Test can't reach.
- **Room in-memory database** — for repository tests.
- **MockWebServer** (from `okhttp3:mockwebserver`) — for API tests.

### What is **deliberately NOT** in the stack

- ❌ **Hilt navigation compose** in any complex way — use simple Hilt + Compose Navigation.
- ❌ **RxJava.** Coroutines + Flow only.
- ❌ **Realm or any non-Room database.** Room is the standard.
- ❌ **Glide.** Coil is more modern and Compose-native.
- ❌ **Volley, OkHttp without Retrofit.** Retrofit is the standard.
- ❌ **Moshi.** Kotlinx Serialization is more idiomatic.
- ❌ **WebView for any UI.** Native Compose throughout.
- ❌ **Multidex.** Modern AGP handles this automatically; not needed with minSdk 29.
- ❌ **Firebase products other than FCM.** No Firebase Analytics, no Firestore, no Crashlytics (use Sentry instead).

## 3.2 · Project structure

```
android/
├── app/
│   ├── build.gradle.kts
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/app/omnidesk/
│   │   │   │   ├── OmniDeskApplication.kt       # Hilt entry
│   │   │   │   ├── MainActivity.kt              # Single activity
│   │   │   │   ├── core/
│   │   │   │   │   ├── di/                      # Hilt modules
│   │   │   │   │   ├── network/                 # Retrofit, OkHttp, interceptors
│   │   │   │   │   ├── auth/                    # JWT storage, refresh logic
│   │   │   │   │   ├── sync/                    # Sync engine
│   │   │   │   │   ├── notifications/           # FCM service, deep links
│   │   │   │   │   ├── crash/                   # Sentry init
│   │   │   │   │   └── util/
│   │   │   │   ├── data/
│   │   │   │   │   ├── local/                   # Room entities, DAOs, database
│   │   │   │   │   ├── remote/                  # Retrofit services, DTOs
│   │   │   │   │   ├── mapper/                  # DTO ↔ Entity ↔ Domain
│   │   │   │   │   └── repository/              # One per module
│   │   │   │   ├── domain/
│   │   │   │   │   ├── model/                   # Plain Kotlin data classes
│   │   │   │   │   └── usecase/                 # Business operations
│   │   │   │   └── ui/
│   │   │   │       ├── theme/                   # Material 3 ColorScheme, typography
│   │   │   │       ├── components/              # Reusable Composables
│   │   │   │       ├── navigation/              # NavGraph
│   │   │   │       └── screens/
│   │   │   │           ├── auth/                # Login, register, 2FA
│   │   │   │           ├── home/                # Dashboard
│   │   │   │           ├── notes/
│   │   │   │           ├── calendar/
│   │   │   │           ├── lists/
│   │   │   │           ├── todos/
│   │   │   │           ├── habits/
│   │   │   │           ├── finance/
│   │   │   │           ├── settings/
│   │   │   │           └── admin/               # Only if user.isAdmin
│   │   │   └── res/
│   │   │       ├── drawable/
│   │   │       ├── mipmap-*/                    # Launcher icon
│   │   │       ├── values/                      # Strings (English only in MVP), themes
│   │   │       └── xml/                         # data_extraction_rules, network_security_config
│   │   ├── test/                                # Unit tests
│   │   └── androidTest/                         # Instrumented tests
│   └── proguard-rules.pro
├── gradle/
│   └── libs.versions.toml                       # Version catalog
├── build.gradle.kts                             # Root
├── settings.gradle.kts
├── gradle.properties
├── README.md
└── ROADMAP_ANDROID.md                           # This document
```

## 3.3 · Data model · Local (Room)

The local Room schema **mirrors the Prisma schema** of the backend, with adaptations for offline support and to avoid storing data that doesn't make sense locally (other users' data, server-side logs).

### Adaptations from Prisma → Room

1. **Every entity has `syncStatus` and `createdLocally` fields:**
   - `syncStatus: SyncStatus` enum: `SYNCED`, `PENDING_CREATE`, `PENDING_UPDATE` (post-MVP), `FAILED_SYNC`.
   - `createdLocally: Boolean` — true if entity was created offline and hasn't been confirmed by backend.
2. **UUIDs are stored as `String` (Room doesn't have native UUID).** Generated client-side via `UUID.randomUUID().toString()` for offline creations.
3. **Timestamps as `Long` (epoch milliseconds).** Converted to/from ISO 8601 strings at API boundary.
4. **Foreign keys with `ForeignKey.CASCADE` for child entities** to mirror Prisma's cascades.
5. **Indices on (userId, ...)** for queries. Even though local DB is single-user (we only cache the logged-in user's data), preserving the userId column makes API mapping cleaner.
6. **JSON columns stored as `String`** (serialized). Examples: `Note.content` (TipTap JSON), `ListItem.customFields`, `Theme.config`.

### Entities to cache locally

All user-owned entities from Prisma. Approximately 32 tables in total, mirrored as Room entities. Highlights:

```kotlin
@Entity(tableName = "notes")
data class NoteEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val title: String,
    val content: String,         // serialized TipTap JSON
    val plainText: String?,      // for local search
    val icon: String?,
    val coverImageUrl: String?,
    val isPinned: Boolean,
    val tags: String,            // comma-separated, since Room doesn't have List<String> natively
    val createdAt: Long,
    val updatedAt: Long,
    val syncStatus: SyncStatus,
    val createdLocally: Boolean,
)
```

```kotlin
@Entity(tableName = "calendar_events")
data class CalendarEventEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val title: String,
    val description: String?,
    val startDate: Long,
    val endDate: Long,
    val isAllDay: Boolean,
    val location: String?,
    val color: String?,
    val createdAt: Long,
    val updatedAt: Long,
    val syncStatus: SyncStatus,
    val createdLocally: Boolean,
)
```

(All 30+ entities follow the same pattern. Implemented in B-AND-2.)

### What is NOT cached locally

- **Admin endpoints** (`/admin/*`). The admin panel queries the backend live each time. No caching of other users' data.
- **AuditLog.** Server-side only.
- **PushSubscription** rows other than the current device's.
- **Themes belonging to other users.** Only this user's themes + system themes are cached.

### Database migrations

Room handles schema migrations via `Migration` classes. Each schema version is committed with its migration. **Same rule as backend:** forward-only, never drop data without prior migration logic.

## 3.4 · Sync engine

The heart of the app's offline behavior. Implemented in `core/sync/`.

### Core concepts

- **Read flow:** UI requests data from a `Repository`. Repository returns `Flow<List<T>>` backed by Room (`@Query` returns Flow). On collection, repository triggers a background fetch from backend if needed (stale-while-revalidate strategy with 5-minute freshness window for most entities).
- **Write flow online:** UI calls a use case → repository → API. Success → update Room → UI updates via Flow. Failure → exception propagated to ViewModel → UI shows error.
- **Write flow offline (bounded):** UI calls a use case → repository detects network unavailable → inserts entity into Room with `syncStatus = PENDING_CREATE` and `createdLocally = true`, generating UUID client-side. UI updates immediately via Flow.
- **Sync push:** WorkManager job (triggered on network reconnect via `ConnectivityManager` + `NetworkCallback`) pushes all `PENDING_CREATE` entities to backend in order of `createdAt`. On success, updates `syncStatus = SYNCED` and `createdLocally = false`. On failure, marks `FAILED_SYNC` and shows persistent UI banner.

### Sync protocol details

#### Bounded offline rules (D-AND-004 from §1.4)

The user can perform these operations offline:

- ✅ **Create** new entities (notes, events, todos, transactions, habit entries, wishlist items, planned purchases, savings contributions).
- ✅ **Edit** entities that were created in the current offline session (i.e., still have `createdLocally = true`).
- ✅ **Delete** entities created in the current offline session.

The user **cannot** perform these operations offline:

- ❌ Edit, move, archive, or delete any entity that has `syncStatus = SYNCED` (i.e., known to exist on server).
- ❌ Reorder items in a list (kanban, list items).
- ❌ Change list custom fields, theme, settings.
- ❌ Mark TODO items as complete (this is a state change on an existing entity).
- ❌ Mark habits as done (this is creating an entity tied to an existing habit — **explicit exception**: see below).

#### Exceptions to the "no edits offline" rule

**Habit entries are creation-only by nature.** Marking a habit done creates a new `HabitEntry`. This is a create on `HabitEntry`, not an edit on `Habit`. So it's allowed offline. The entry is created locally with `syncStatus = PENDING_CREATE`.

**However:** unmarking a habit (deleting a `HabitEntry`) is allowed offline **only if that entry was created in the current offline session**. If the entry was synced earlier and the user wants to undo it, requires network.

### UUID strategy (D-AND-009)

The client generates UUIDs for **all** entity creations, online or offline. The backend accepts client-proposed UUIDs (see §5 for backend changes). This eliminates the "tempId" complexity entirely.

```kotlin
// Always:
val newNote = NoteEntity(
    id = UUID.randomUUID().toString(),
    // ...
)
```

If the backend rejects a UUID for any reason (e.g., collision — astronomically unlikely with v4 UUIDs), the client falls back to generating a new UUID and retrying. This case is logged but transparent to the user.

### Conflict avoidance

By restricting offline operations to creations only, **no conflicts are possible**:

- Two devices creating different entities offline → both sync successfully, both exist.
- One device offline (creating), another device online (editing existing entities) → no overlap; both operate on disjoint sets of data.
- One device offline for an extended period, comes back online → creations push successfully; no edits to reconcile.

This is the philosophical choice that makes the sync engine tractable for a single developer.

### Initial sync on first login

When the user logs in for the first time on a device (or after clearing app data):

1. App receives JWT tokens, stores in EncryptedSharedPreferences.
2. App calls `GET /sync/snapshot` (new endpoint, §5).
3. Backend returns a single JSON payload with all user data in one shot (notes, events, lists, todos, habits, finance, themes, notification configs). For typical users <10MB.
4. App parses, populates Room with `syncStatus = SYNCED, createdLocally = false`.
5. Initial sync complete. UI navigates to home.

For large users (>10MB), the snapshot endpoint streams in chunks. UI shows progress.

**Fallback:** if `/sync/snapshot` is unavailable (older backend), app falls back to per-module fetches (`GET /notes`, `GET /calendar/events`, etc.) in parallel. Slower but works.

### Periodic refresh

Every time the app comes to foreground, if last sync was >5 minutes ago, trigger background refresh:

1. For each module: `GET /<module>?modifiedSince=<lastSync>`.
2. Backend returns only changed entities (requires `modifiedSince` parameter on backend list endpoints — see §5).
3. App updates Room: inserts new, updates existing, deletes ones marked as deleted server-side.

**MVP simplification:** if `modifiedSince` is not implemented yet, fall back to full refetch on every foreground (acceptable for MVP scale).

## 3.5 · Authentication and session

### Token storage

- **Access token** (JWT, 15min lifetime): EncryptedSharedPreferences.
- **Refresh token** (JWT, 7d lifetime): EncryptedSharedPreferences.
- **Session persistence:** the app stays logged in indefinitely as long as the refresh token is valid. If the refresh token expires without being used (user opens app after 7+ days of inactivity), user is logged out and must log in again.

### Auto-refresh

- OkHttp `Authenticator` intercepts 401 responses, calls `/auth/refresh`, retries the original request with the new access token.
- Refresh token rotation: post-MVP (consistent with web).

### 2FA flow (D-AND-010)

Mirrors web (`ROADMAP.md` §4.4 Block B2):

1. Login screen: email + password.
2. On 200 OK with `requires2FA: true`, app navigates to 2FA screen.
3. User enters 6-digit TOTP code (or 8-char backup code).
4. App calls `POST /auth/2fa/verify` with code and intermediate token.
5. On success, app stores access + refresh tokens, navigates to home.

The app **does not** function as an authenticator itself in MVP. The user uses Google Authenticator, Authy, 1Password, Bitwarden, etc., on the same or another device.

### Logout

- User taps "Sign out" in settings.
- App calls `POST /auth/logout` (if endpoint exists, otherwise just clears local state).
- App clears EncryptedSharedPreferences (tokens).
- App clears Room (all cached data — privacy, no data of logged-out users lingers).
- App unregisters FCM device token: `DELETE /devices/:id`.
- App navigates to login screen.

### Backend URL configuration

- **Build flavors:** `dev` (points at `http://10.0.2.2:3000` for emulator local backend), `prod` (points at `https://omnidesk.app`).
- **Runtime override:** Settings → "Custom backend URL". Power-user feature for forks; not advertised. Requires login again after change.

## 3.6 · Notifications

### Push notification flow

1. User logs in. App requests `POST_NOTIFICATIONS` permission (Android 13+).
2. App requests FCM registration token via `FirebaseMessaging.getToken()`.
3. App sends token to backend: `POST /devices/register { token, platform: "android", deviceLabel, userAgent }`.
4. Backend stores in `PushSubscription` table.
5. When backend's scheduler fires a notification for this user, it sends FCM payload to all the user's `PushSubscription` rows where `platform = "android"`.
6. FCM delivers to device. App's `OmniDeskFirebaseMessagingService` receives the message.
7. App displays system notification with: title, body, custom icon (from notification config), deep link to entity.
8. User taps notification → app opens to specific entity (e.g., `omnidesk://notes/abc-123` → opens note editor).

### Notification permissions

- **POST_NOTIFICATIONS** (Android 13+) — requested **at first relevant moment**, not at app launch. E.g., when user enables their first notification or attaches a reminder. Following Android best practice.
- **SCHEDULE_EXACT_ALARM** — not requested; we don't use exact alarms (everything goes through FCM).

### Deep linking

App supports these URI schemes:

```
omnidesk://notes/{id}
omnidesk://calendar/events/{id}
omnidesk://lists/{id}/items/{itemId}
omnidesk://todos/items/{id}
omnidesk://habits/{id}
omnidesk://finance/transactions/{id}
omnidesk://wishlist/{id}
omnidesk://savings/{id}
```

Configured in `AndroidManifest.xml` with `<intent-filter>` for `MainActivity`.

### Local notifications (post-MVP)

The web scheduler handles all reminders server-side. The Android app does not maintain local AlarmManager schedules — all notifications come via FCM. This keeps logic centralized.

**Trade-off:** if device is offline at notification time, push is queued by FCM (delivered up to 28 days later when device reconnects). For typical use this is fine. If real offline-precise local notifications become important, post-MVP work.

## 3.7 · Image handling

### Display

- **Coil's `AsyncImage`** for all remote images.
- **Disk cache:** Coil's default (configured to ~250 MB max).
- **Memory cache:** Coil's default (proportional to device memory).

### Upload

- User picks image via system picker (`PickVisualMediaRequest`).
- Or captures via CameraX.
- App compresses to max 1920×1920, WebP, quality 85 (matches backend's resize logic).
- App uploads via `POST /uploads` multipart.
- Backend returns `{ url, thumbUrl }`. App uses returned URLs.

### Cache invalidation

- When user updates their avatar (or any image), the URL changes (backend assigns new UUID). Coil's URL-based cache handles this automatically.

## 3.8 · Theming

### Material 3 ColorScheme

Each of the 12 system themes from the web is reimplemented as a Compose `ColorScheme`:

```kotlin
val DefaultTheme = lightColorScheme(
    primary = Color(0xFF6750A4),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEADDFF),
    // ... full Material 3 scheme
)
```

Theme switching: user's `activeThemeId` from backend determines which `ColorScheme` to apply at app launch.

### Custom themes from backend

Themes created by the user via web are downloaded as part of sync. The user's custom theme JSON is parsed into a Compose `ColorScheme` at runtime.

### Dynamic colors (post-MVP)

Android 12+ supports Material You dynamic colors (themed from wallpaper). MVP does not use this — too much divergence from web themes. Post-MVP option as user preference.

### Dark mode

Following system setting. Each ColorScheme has a light and dark variant. App responds to system theme change automatically via Compose's `isSystemInDarkTheme()`.

## 3.9 · Performance targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cold start | <2s | Macrobenchmark on Pixel 6a |
| Warm start | <800ms | Macrobenchmark |
| List scroll (100 items) | 60fps | GPU profiling |
| Image load (cached) | <50ms | Coil metrics |
| Initial sync (typical user, <5MB) | <10s | Manual test |
| Note save | <100ms (online) | Sentry transaction |
| Search query | <300ms | Sentry transaction |

### How we achieve these

- **Lazy lists** (`LazyColumn`, `LazyVerticalGrid`) for all listings.
- **Compose stability annotations** (`@Immutable`, `@Stable`) on data classes to avoid recompositions.
- **Room queries return Flow**, only emit when data changes.
- **Image preloading** for visible items.
- **R8 with full mode** in release builds (shrinking, optimization, obfuscation).
- **Baseline profiles** (post-MVP).

## 3.10 · Security

### At rest

- **JWT and refresh tokens** in EncryptedSharedPreferences (AES-256, Keystore-backed).
- **Room database:** plaintext in MVP. SQLCipher integration post-MVP if user demand exists.
- **No biometric lock** in MVP (D-AND-007 stays at "tablet UI"; biometric is a separate post-MVP decision).

### In transit

- **HTTPS only** in release builds. HTTP allowed in debug builds for `10.0.2.2` (emulator host).
- **Certificate pinning:** post-MVP. Adds operational fragility (if cert rotates, app breaks). MVP relies on system CA trust.
- **`NetworkSecurityConfig`** declares cleartext allowed for debug, HTTPS-only for release.

### Permissions requested

In `AndroidManifest.xml`:

- `INTERNET` (normal)
- `POST_NOTIFICATIONS` (runtime, Android 13+)
- `CAMERA` (runtime, when user uses camera)
- `RECORD_AUDIO` (runtime, when user uses voice notes)
- `READ_MEDIA_IMAGES` (runtime, Android 13+, when picking images)

No SMS, no location, no contacts, no calendar (we have our own).

### Permissions NOT requested

- No `WRITE_EXTERNAL_STORAGE` (we use scoped storage, app-internal directories).
- No `READ_EXTERNAL_STORAGE`.
- No `ACCESS_FINE_LOCATION`.
- No `ACCESS_NETWORK_STATE` (deprecated approach; we use `ConnectivityManager` callbacks).
- No `WAKE_LOCK` (WorkManager handles wake locks internally).

## 3.11 · Accessibility

- **TalkBack support:** all interactive Composables have content descriptions.
- **Text scaling:** all text uses `sp` units; no `dp` for text.
- **Color contrast:** Material 3 ColorSchemes have proper contrast ratios by default; custom themes warned in editor (web) if low contrast.
- **Touch targets:** minimum 48×48 dp (Material guideline).
- **Focus management:** explicit focus order for forms.

These are baseline. Full a11y audit is post-MVP.

## 3.12 · Internationalization

**English only in MVP.** Strings in `res/values/strings.xml`. No `res/values-es/` etc.

When the web adds i18n (post-MVP Wave 6 of `ROADMAP.md`), the Android app follows.

## 3.13 · Decisions registered in this section

| # | Decision |
|---|----------|
| D-AND-008 | Compose Rich Editor library for note editing |
| D-AND-009 | Client-generated UUIDs for all creations (online and offline) |
| D-AND-010 | 2FA flow mirrors web; app is not itself an authenticator |

---

# §4 · Roadmap by blocks

> This section **orders the work** for the Android app. Each block has: objective, scope, acceptance criteria, required tests, dependencies, effort estimate. Blocks ordered by dependency.

## 4.1 · Overview

```
B-AND-0 · Developer setup & project scaffolding (1 week)
   ↓
B-AND-1 · Auth & session (2 weeks)
   ↓
B-AND-2 · Sync engine & local cache (2-3 weeks)
   ↓
B-AND-3 · Core modules · notes, calendar, todos, habits (3-4 weeks)
   ↓
B-AND-4 · Heavy modules · lists, finance, themes (2-3 weeks)
   ↓
B-AND-5 · Notifications & FCM (1-2 weeks)
   ↓
B-AND-6 · Mobile-specific features · camera, voice notes, share (2 weeks)
   ↓
B-AND-7 · Polish & performance (1-2 weeks)
   ↓
B-AND-8 · Play Store submission (1 week)
   ↓
─── MVP ───
```

**Total estimated focused work:** 15-20 weeks. For one person in spare time, multiply by 2-3x.

Estimates qualitative (S/M/L/XL) per block.

## 4.2 · B-AND-0 · Developer setup & project scaffolding

**Objective:** developer environment ready, Android Studio installed, empty project compiles, runs on emulator, basic structure in place.

### Scope

- [ ] Install Android Studio Ladybug (or later) per §10.
- [ ] Configure Android SDK: API 35 platform, build-tools, emulator system images.
- [ ] Create AVD (Android Virtual Device): Pixel 7, API 35.
- [ ] Create new project: empty Compose activity, minSdk 29, targetSdk 35, compileSdk 35, Kotlin 2.0+.
- [ ] Set up Gradle version catalog (`libs.versions.toml`) with all dependencies from §3.1.
- [ ] Configure Hilt: add Hilt Gradle plugin, create `OmniDeskApplication` class with `@HiltAndroidApp`.
- [ ] Set up package structure per §3.2.
- [ ] Configure build flavors: `dev` and `prod` with different `BACKEND_URL`.
- [ ] Set up Compose theming scaffolding: `Theme.kt`, `Color.kt`, `Type.kt`.
- [ ] Set up Navigation: `NavGraph` Composable with placeholder destinations (Splash, Login, Home).
- [ ] Create README in `android/` explaining how to build and run.
- [ ] Configure `.gitignore` for Android Studio (`.idea/`, `local.properties`, build outputs).
- [ ] First commit: empty app launches to "Hello OmniDesk" screen on emulator.

### Acceptance criteria

- ✅ `./gradlew assembleDevDebug` produces an APK.
- ✅ APK installs and launches on Pixel 7 API 35 emulator.
- ✅ App shows a placeholder home screen with the app name.
- ✅ Project structure matches §3.2.
- ✅ All dependencies from §3.1 are declared and resolve.
- ✅ Hilt-generated code compiles.

### Required tests

- One unit test that always passes (`assertEquals(2 + 2, 4)`) — proves test runner works.
- One UI test that launches MainActivity and verifies the screen renders — proves Compose UI Test works.

### Effort: **M**

### Blocks for

Everything. This is the foundation.

## 4.3 · B-AND-1 · Auth & session

**Objective:** user can register, log in (including 2FA), and stay logged in across app restarts.

### Scope

**Networking foundation:**

- [ ] Create `OkHttpClient` with logging interceptor (debug only), auth interceptor, authenticator for refresh.
- [ ] Create `Retrofit` instance pointing at flavor's `BACKEND_URL`.
- [ ] Define API service interfaces: `AuthApi`, `UserApi` (others added in later blocks).
- [ ] Define DTOs as Kotlin data classes with `@Serializable` (kotlinx.serialization).
- [ ] Define response envelope: `data class ApiResponse<T>(val data: T, val meta: Meta?)` — matches backend's interceptor wrap.
- [ ] Define error envelope: `data class ApiError(val error: ApiErrorDetail)`. Parsed from non-2xx responses.

**Token storage:**

- [ ] Set up EncryptedSharedPreferences in `core/auth/`.
- [ ] `TokenStorage` class with `saveTokens`, `getAccessToken`, `getRefreshToken`, `clearTokens`.

**Auth screens (Compose):**

- [ ] `SplashScreen`: checks if tokens exist, navigates to Login or Home.
- [ ] `LoginScreen`: email + password + "Forgot password?" + "Register" link.
- [ ] `RegisterScreen`: email, password, password confirmation, T&C checkbox, "no data selling" checkbox, captcha (Cloudflare Turnstile WebView for MVP).
- [ ] `ForgotPasswordScreen`: email input + captcha + submit.
- [ ] `ResetPasswordScreen` (opened from email link): new password + confirmation.
- [ ] `TwoFactorScreen`: 6-digit TOTP input + "Use backup code" toggle.

**Auth flows:**

- [ ] Login: POST `/auth/login` → 200 with tokens (or with `requires2FA`).
- [ ] If `requires2FA`: navigate to `TwoFactorScreen`, on verify POST `/auth/2fa/verify`.
- [ ] On success: save tokens, navigate to Home.
- [ ] Register: validate inputs, captcha, POST `/auth/register` → success message about email verification.
- [ ] Auto-refresh: OkHttp `Authenticator` calls `/auth/refresh` on 401.
- [ ] Logout: clear tokens, clear Room (will exist after B-AND-2), navigate to Login.

**Email verification:**

- [ ] Backend sends verification email with link `https://omnidesk.app/verify-email?token=XXX`.
- [ ] App registers an intent filter on `omnidesk.app/verify-email`.
- [ ] When user taps link on Android with app installed, app handles deep link, calls POST `/auth/verify-email`, shows success.

**Session check on launch:**

- [ ] SplashScreen calls `GET /auth/me` with access token.
- [ ] 200 → navigate to Home.
- [ ] 401 → attempt refresh.
- [ ] Refresh 401 → clear tokens, navigate to Login.

**ViewModels:**

- [ ] `AuthViewModel` exposing `LoginUiState`, `RegisterUiState`, `TwoFactorUiState`. Handles all auth use cases.

### Acceptance criteria

- ✅ User can register a new account from app; receives verification email; verifies; can log in.
- ✅ User with 2FA enabled is required to enter code before reaching Home.
- ✅ Backup code works once and is consumed.
- ✅ Tokens persist across app force-close.
- ✅ Access token expiry triggers automatic refresh; user doesn't see it.
- ✅ Refresh token expiry sends user to login.
- ✅ Logout clears all local state.
- ✅ Captcha is required on register and forgot-password.

### Required tests

- Unit tests: `TokenStorage` (save, retrieve, clear).
- Unit tests: `AuthRepository` with `MockWebServer` for each endpoint.
- UI tests: login flow (valid credentials → home, invalid → error message).
- UI test: 2FA flow (correct code → home, wrong code → error).
- Integration test: token refresh on 401 (via MockWebServer responding 401 → refresh → original request retried).

### Effort: **L**

## 4.4 · B-AND-2 · Sync engine & local cache

**Objective:** Room database in place, sync engine works for one module end-to-end, foundations for all subsequent modules.

### Scope

**Room setup:**

- [ ] Create `OmniDeskDatabase` class extending `RoomDatabase`.
- [ ] Define entities for ALL modules (notes, calendar, lists, todos, habits, finance, themes, notifications). ~30 entities total.
- [ ] Create DAOs for each entity (CRUD operations, Flow-returning queries).
- [ ] Define type converters: `LongDateConverter`, `StringListConverter` (for tags), `JsonStringConverter`.
- [ ] First Room migration: version 1 schema.
- [ ] `RoomDatabase.Builder` configuration with migrations callback.

**Sync engine core:**

- [ ] `SyncEngine` class in `core/sync/`.
- [ ] `ConnectivityManager.NetworkCallback` listener — tracks online/offline state, exposes `Flow<Boolean>`.
- [ ] `SyncStatus` enum.
- [ ] `Repository` base abstraction with stale-while-revalidate logic.
- [ ] Backend changes consumed: client-proposed UUIDs (depends on §5.1 being deployed).
- [ ] WorkManager periodic worker `SyncPendingCreatesWorker` — runs on network reconnect, pushes all `PENDING_CREATE` entities.

**Initial sync:**

- [ ] Implement `/sync/snapshot` endpoint on backend (§5.2).
- [ ] On first login: app calls `/sync/snapshot`, populates Room.
- [ ] Fallback: if endpoint unavailable, parallel per-module fetches.
- [ ] Progress UI: "Syncing your data..." with progress indicator.

**One module end-to-end as proof of concept:**

- [ ] Implement Notes module fully through the stack: API service, DTO, Entity, mapper, DAO, repository, use cases, ViewModel, screens.
- [ ] `NotesListScreen` showing all notes (cached from Room).
- [ ] `NoteEditorScreen` with Compose Rich Editor (D-AND-008).
- [ ] Create note offline → UUID generated, inserted as `PENDING_CREATE`.
- [ ] Edit note offline (only if `createdLocally = true`) → update in Room.
- [ ] Delete note offline (only if `createdLocally = true`) → delete from Room.
- [ ] Network reconnects → SyncEngine pushes pending creates → backend accepts → entities marked SYNCED.

**Offline indicator UI:**

- [ ] Global banner shown when offline.
- [ ] Subtle indicator on entities with `syncStatus = PENDING_CREATE`.
- [ ] Toast on sync success: "Synced X items".

### Acceptance criteria

- ✅ Empty database is populated on first login from `/sync/snapshot`.
- ✅ Reopening app shows data from Room without network call (instant).
- ✅ Foreground refresh fetches updates from backend if last sync >5min ago.
- ✅ Creating a note offline works and persists.
- ✅ Editing an offline-created note works.
- ✅ Editing a synced note offline shows "requires connection" message.
- ✅ Reconnecting network triggers sync, pending notes upload, status updates.
- ✅ Network loss mid-sync handled gracefully (retry on next reconnect).
- ✅ Multi-tenant safety: clearing app data fully removes another user's data from Room.

### Required tests

- Unit: `SyncEngine` push logic with mocked API.
- Unit: each DAO's queries (with in-memory Room).
- Unit: mappers (DTO ↔ Entity ↔ Domain).
- Integration: full notes flow offline → online → synced.
- UI: Notes list, editor, create, edit, delete.
- Multi-tenant test: log in as user A, create data, log out, log in as user B, verify no data from A visible.

### Effort: **XL**

### Blocks for

All other modules. This is the most critical block.

## 4.5 · B-AND-3 · Core modules

**Objective:** notes (done in B-AND-2), calendar, todos, habits implemented end-to-end. These are the most mobile-relevant modules.

### Scope per module

For each module, replicate the pattern from Notes:

- API service interface.
- DTOs.
- Room entities (already defined in B-AND-2, just consume).
- DAOs (already defined).
- Mappers.
- Repository.
- Use cases.
- ViewModel.
- Compose screens.
- Offline creation flow.
- Tests.

**Calendar:**

- [ ] `CalendarMonthScreen` with Calendar Compose component.
- [ ] `CalendarWeekScreen`.
- [ ] `CalendarAgendaScreen` (mobile-friendly day list).
- [ ] `EventEditorScreen`.
- [ ] Calendar settings (size, firstDay, defaultView) synced from backend.
- [ ] Tap event in calendar → opens editor.
- [ ] FAB → create event with current date selected.

**TODO Kanban:**

- [ ] `TodoBoardScreen` with horizontal pager over columns.
- [ ] Each column is `LazyColumn` of items.
- [ ] Drag-drop within column via Reorderable Compose.
- [ ] Drag between columns (more complex; may degrade to "move via long-press menu" in MVP if drag-between proves hard).
- [ ] `TodoItemEditorScreen`.
- [ ] Mark complete: requires network (it's an edit on existing entity).

**Habits:**

- [ ] `HabitsHomeScreen` showing today's active habits as cards.
- [ ] Tap to toggle done (creates `HabitEntry` — allowed offline).
- [ ] `HabitDetailScreen` with heatmap (90 days), streak, stats.
- [ ] `HabitEditorScreen`.
- [ ] Habits home is the **default home tab** (alongside Calendar, Notes shortcuts).

### Acceptance criteria

- ✅ Each module fully usable: view, create, edit (when online), delete (when online).
- ✅ Calendar shows month, week, agenda views.
- ✅ TODO drag-drop works smoothly within columns.
- ✅ Marking a habit done works offline; syncs on reconnect.
- ✅ All listings scroll smoothly with 100+ items.

### Required tests

- Per module: repository tests, screen UI tests.
- Cross-module: navigation between Notes ↔ Calendar ↔ Todos ↔ Habits via bottom nav.

### Effort: **L**

## 4.6 · B-AND-4 · Heavy modules

**Objective:** lists, finance, themes. These have more complex UI.

### Scope

**Lists:**

- [ ] `ListsHomeScreen`: grid of lists, each as a tile with cover.
- [ ] `ListDetailScreen`: items in selected view (grid, card, table — match web's 6 view types).
- [ ] Custom fields rendering: dynamic UI based on field types (TEXT, NUMBER, DATE, URL, BOOLEAN, SELECT, MULTI_SELECT, RATING, IMAGE_URL).
- [ ] `ListItemEditorScreen` with dynamic form for custom fields.
- [ ] Tags, sort, filter (client-side; web has server-side too, app uses cached data).

**Finance:**

- [ ] `FinanceDashboardScreen`: income/expense summary, charts (Vico), top categories, current budget status.
- [ ] `TransactionsListScreen`.
- [ ] `TransactionEditorScreen` (quick capture optimized — 5 taps from app launch).
- [ ] `BudgetsScreen`.
- [ ] `CategoriesScreen`.
- [ ] **Finance Organizer** sub-screens:
  - `WishlistScreen`.
  - `PlannedPurchasesScreen`.
  - `SavingsGoalsScreen` with progress UI.

**Themes:**

- [ ] `ThemesScreen`: list of system themes + user's custom themes.
- [ ] Tap to activate → updates `User.activeThemeId` on backend → app re-themes.
- [ ] **No theme editing in app MVP.** User creates/edits themes on web. App only displays and activates.

### Acceptance criteria

- ✅ Lists with custom fields render correctly for all 9 field types.
- ✅ Quick transaction capture is achievable in ≤5 taps from cold app launch.
- ✅ Finance dashboard charts render correctly.
- ✅ Theme activation immediately changes app appearance.

### Effort: **L**

## 4.7 · B-AND-5 · Notifications & FCM

**Objective:** push notifications work end-to-end. User configures from app, receives system notifications, taps to deep-link.

### Scope

**FCM setup:**

- [ ] Create Firebase project in console.firebase.google.com.
- [ ] Add Android app to project (package `app.omnidesk`).
- [ ] Download `google-services.json`, place in `android/app/`.
- [ ] Add Google Services Gradle plugin.
- [ ] Configure FCM in `AndroidManifest.xml`.

**Backend integration (§5.3):**

- [ ] Backend endpoint `POST /devices/register` deployed.
- [ ] App calls on first login + when token refreshes.

**FCM service:**

- [ ] `OmniDeskFirebaseMessagingService` extending `FirebaseMessagingService`.
- [ ] `onMessageReceived`: parse payload, create NotificationChannel, post system notification with deep link.
- [ ] `onNewToken`: send new token to backend.

**Notification channels:**

- [ ] Default channel: "OmniDesk reminders".
- [ ] (Future: per-module channels, post-MVP.)

**Permission flow:**

- [ ] Request `POST_NOTIFICATIONS` at first relevant moment (when user enables their first notification or attaches one to an entity).
- [ ] Settings screen → "Notifications" section → toggle enable + link to system settings.

**Deep linking:**

- [ ] `AndroidManifest.xml` intent filters for `omnidesk://` and `https://omnidesk.app/` schemes.
- [ ] `MainActivity` handles deep link in `onCreate` and `onNewIntent`.
- [ ] Navigation routes to corresponding entity screen.

**Notification config UI:**

- [ ] `NotificationConfigsScreen`: list of user's NotificationConfigs.
- [ ] `NotificationConfigEditorScreen`: create/edit (one-off, scheduled, recurring).
- [ ] **Attach panel:** `NotificationAttachPanel` Composable reused in: event editor, note editor, todo editor, habit editor, list item editor, wishlist item editor, planned purchase editor, savings goal editor.

**Device management:**

- [ ] Settings → "My devices": list of registered devices with names.
- [ ] User can name device.
- [ ] User can revoke any device.

### Acceptance criteria

- ✅ User receives push notification when configured time arrives.
- ✅ Tapping notification opens app to specific entity.
- ✅ User can disable notifications at OS level; app handles gracefully.
- ✅ Notification config attaches to all 8 entity types.
- ✅ Device list shows all registered devices.

### Required tests

- Unit: `OmniDeskFirebaseMessagingService.onMessageReceived` with mocked payload.
- Manual: send test push from Firebase console, verify received.
- UI: attach notification to a note, verify saved.

### Effort: **L**

## 4.8 · B-AND-6 · Mobile-specific features

**Objective:** camera, voice notes, share intent. These are the features that justify having a mobile app beyond "smaller web".

### Scope

**Camera integration:**

- [ ] `CameraX` setup with `PreviewView`.
- [ ] Screen: `CameraCaptureScreen` accessible from:
  - Note editor → "Insert photo" → option "Take photo".
  - Wishlist item editor → option "Take photo".
  - Transaction editor → "Receipt photo" (post-MVP feature, but UI hook exists).
- [ ] After capture: preview, accept, compress, upload via `/uploads`, insert URL into context.
- [ ] Permission flow for `CAMERA`.

**Voice notes (D-AND-006):**

- [ ] `MediaRecorder` setup for `.m4a` recording.
- [ ] Screen: `VoiceNoteRecorderScreen` accessible from:
  - Notes list FAB long-press → "New voice note".
  - Note editor → "Insert voice note".
- [ ] During recording: live transcription via `SpeechRecognizer` (on-device when available, displays as text in real time).
- [ ] After recording: option to:
  - Save audio file + transcription as a new note.
  - Save only transcription as text.
  - Discard.
- [ ] Audio uploaded via `/uploads` (after adding `audio/mp4` to allowed MIME types — see §5).
- [ ] Permission flow for `RECORD_AUDIO`.

**Share intent (D-AND-011):**

- [ ] Register intent filters in `AndroidManifest.xml`:
  - `ACTION_SEND` with `text/plain` → create note from shared text.
  - `ACTION_SEND` with `image/*` → create note with image, or attach to existing note.
- [ ] `ShareReceiverActivity` handles incoming share intent, navigates user to "save to OmniDesk" flow.
- [ ] User chooses destination: new note, existing note (search), list item, todo item.

### Acceptance criteria

- ✅ User can take photo and insert into note in <3 taps.
- ✅ Voice note records audio and shows live transcription.
- ✅ Sharing text from another app (browser, messages) lands in OmniDesk's share flow.
- ✅ All permission requests are explained with rationale before system prompt.

### Required tests

- Manual: full camera flow on physical device.
- Manual: voice note transcription accuracy spot-check.
- Manual: share intent from Chrome, Messages, Gallery.

### Effort: **L**

## 4.9 · B-AND-7 · Polish & performance

**Objective:** the app feels solid before going to store.

### Scope

**Performance:**

- [ ] Profile cold start, fix anything >2s.
- [ ] Profile list scroll, ensure 60fps.
- [ ] Add `@Immutable` and `@Stable` where appropriate.
- [ ] Configure R8 full mode in release build.
- [ ] Add ProGuard rules for kotlinx.serialization, Hilt, Room (most have rules bundled; verify).
- [ ] App size: aim for <30 MB APK.

**Animations & motion:**

- [ ] Material motion specs applied: navigation transitions, FAB scale, list item add/remove.
- [ ] No motion that exceeds Material's "long4" duration (~500ms).

**Empty states:**

- [ ] Every list screen has an empty state with CTA (e.g., "No notes yet. Tap + to create one.").
- [ ] Empty states match app theme.

**Error states:**

- [ ] Network errors: friendly message + retry button.
- [ ] Server errors: friendly message + "Try again later".
- [ ] No raw stack traces ever visible.

**Loading states:**

- [ ] Skeleton screens for lists during initial load.
- [ ] Progress indicators for long operations (sync, image upload).
- [ ] Optimistic UI for fast actions (create note appears immediately, before backend response).

**Onboarding:**

- [ ] First-time launch shows brief welcome (3 screens max).
- [ ] Highlights: "Your data is yours", "Works offline", "No ads ever".

**Accessibility:**

- [ ] All interactive Composables have `contentDescription`.
- [ ] Text scaling tested up to 200%.
- [ ] TalkBack walkthrough of main screens.

**Crash reporting:**

- [ ] Sentry SDK integrated.
- [ ] Source maps uploaded on release builds.
- [ ] PII scrubbing: no email, no JWT, no note content in crash reports.

**Sentry filters:**

- [ ] Filter out network errors as "info" (not crashes).
- [ ] Filter cancelation exceptions (user navigated away).

### Acceptance criteria

- ✅ Cold start <2s on Pixel 6a equivalent.
- ✅ Crash-free rate >99% over 7-day Sentry test.
- ✅ All empty states have CTAs.
- ✅ TalkBack walkthrough is coherent.

### Effort: **M**

## 4.10 · B-AND-8 · Play Store submission

**Objective:** app published in Play Store, Internal Testing track active.

### Scope

**Play Console setup:**

- [ ] Register Google Play Console account ($25 one-time).
- [ ] Create app entry: name "OmniDesk", package `app.omnidesk`.
- [ ] App category: Productivity.

**Store listing:**

- [ ] App name: OmniDesk.
- [ ] Short description (80 chars): "Your self-hosted personal organizer. Notes, calendar, habits, finance — yours."
- [ ] Full description (4000 chars): adapted from web's marketing copy. Emphasize: privacy, no ads, no data selling, self-hostable.
- [ ] Icon: 512×512 PNG, designed for adaptive icon (foreground + background layers).
- [ ] Feature graphic: 1024×500.
- [ ] Screenshots: 8 screens (home, notes list, note editor, calendar, habits, finance, lists, settings). 1080×1920 minimum.
- [ ] Privacy policy URL: `https://omnidesk.app/privacy`.
- [ ] Terms URL: `https://omnidesk.app/terms`.

**Data safety form:**

- [ ] Data collected: email (account creation only), user-generated content (stored on user's server), crash data (via Sentry, no PII).
- [ ] Data shared: none.
- [ ] Data encrypted in transit: yes.
- [ ] Users can request data deletion: yes (in-app).

**Build for release:**

- [ ] Configure signing config: generate release keystore (store password securely, BACK UP).
- [ ] `gradle.properties` references `release-key.properties` (gitignored).
- [ ] Build release AAB: `./gradlew bundleProdRelease`.
- [ ] Verify AAB with `bundletool` locally.

**Internal Testing track:**

- [ ] Upload first AAB to Internal Testing.
- [ ] Add own email as tester.
- [ ] Install from Play Store (internal track URL) on personal device.
- [ ] Verify everything works end-to-end on real device.

**Pre-launch checks:**

- [ ] Pre-launch report runs (Play Console auto-tests on multiple device models).
- [ ] Address any reported crashes or issues.

**Production release:**

- [ ] Promote from Internal Testing → Production.
- [ ] Wait for Google review (1-7 days typically; can be longer).
- [ ] On approval: app live.

### Acceptance criteria

- ✅ App listed in Play Store, searchable by "OmniDesk".
- ✅ Author can install app from Play Store on personal device.
- ✅ Data safety form accurate.
- ✅ Privacy policy and terms accessible from listing.

### Effort: **M**

## 4.11 · What's in MVP

**MVP = B-AND-0 + B-AND-1 + B-AND-2 + B-AND-3 + B-AND-4 + B-AND-5 + B-AND-6 + B-AND-7 + B-AND-8.**

All 8 modules with parity to web, push notifications, camera, voice notes, share intent, Play Store published.

## 4.12 · What's NOT in MVP

Goes to §8 post-MVP:

- Widgets (home screen).
- Biometric lock (fingerprint/face unlock).
- Quick actions (long-press app icon).
- Tablet-specific layouts.
- Dynamic colors (Material You).
- Wear OS companion.
- Local-only notifications (offline scheduling).
- SQLCipher encryption.
- Certificate pinning.
- Local-language UI (English only).

---

# §5 · Backend changes required

> This section lists **the changes the backend needs** to support the Android app. Each change has: description, why, where it goes in the web roadmap. Implementing these changes is **a prerequisite** for the corresponding Android block.

## 5.1 · Accept client-proposed UUIDs on creation (D-027 in web)

### What

All POST endpoints that create entities currently generate UUIDs server-side via Prisma's `@default(uuid())`. They must accept a client-proposed UUID in the request body, validate it, and use it instead of generating one.

### Why

Required for offline creation in the Android app (D-AND-009). Without this, the app would need a tempId / real-id swap mechanism, which adds complexity to the sync engine.

### Where in web roadmap

Goes into **web Block 0 (Sanitation)** as a subtask. Already noted in this conversation; needs to be added to `ROADMAP.md` §9 as **D-027**.

### Affected endpoints

All `POST /<resource>` endpoints across modules:

- `POST /notes` — accept `id` in body.
- `POST /calendar/events` — accept `id`.
- `POST /lists` — accept `id`.
- `POST /lists/:listId/items` — accept `id`.
- `POST /lists/:listId/fields` — accept `id`.
- `POST /lists/:listId/tags` — accept `id`.
- `POST /todos/boards/:boardId/columns` — accept `id`.
- `POST /todos/boards/:boardId/items` — accept `id`.
- `POST /habits` — accept `id`.
- `POST /habits/:habitId/entries` — accept `id`.
- `POST /finance/boards/:boardId/categories` — accept `id`.
- `POST /finance/boards/:boardId/transactions` — accept `id`.
- `POST /finance/boards/:boardId/budgets` — accept `id`.
- `POST /finance/boards/:boardId/wishlist` — accept `id`.
- `POST /finance/boards/:boardId/planned-purchases` — accept `id`.
- `POST /finance/boards/:boardId/savings-goals` — accept `id`.
- `POST /finance/savings-goals/:goalId/contributions` — accept `id`.
- `POST /notifications/configs` — accept `id`.
- `POST /themes` — accept `id`.

### Implementation pattern

Each DTO gains an **optional** `id` field:

```typescript
// Example: CreateNoteDto
export class CreateNoteDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  title!: string;

  // ... rest of fields
}
```

Each create service:

```typescript
async create(userId: string, dto: CreateNoteDto) {
  return this.prisma.note.create({
    data: {
      id: dto.id, // undefined → Prisma generates via @default
      userId,
      title: dto.title,
      // ...
    },
  });
}
```

Prisma respects an explicit `id` if provided, falls back to `@default(uuid())` if not.

### Edge cases

- **Collision:** if client proposes a UUID that already exists, Prisma throws `P2002` (unique constraint). API returns **409 Conflict** with a clear error code. App regenerates and retries.
- **Invalid UUID format:** `@IsUUID()` validation rejects with 400.
- **UUID belonging to another user:** unique across the entire table, so collision detection catches this too. Returns 409, not 403 (don't leak existence). App regenerates.

### Tests

- Multi-tenant safety: user A creating with a UUID that exists in user B's data → 409.
- UUID validation: malformed → 400.
- Backwards compat: omitting `id` still works.

## 5.2 · Snapshot endpoint for initial sync

### What

New endpoint `GET /sync/snapshot` that returns all the current user's data in a single payload.

### Why

Initial sync on first login (or after clearing app data) needs to populate Room with everything. Doing parallel per-module fetches works but is slower and noisier. A single snapshot endpoint is cleaner.

### Where in web roadmap

This is a **new addition specific to the app**. Add to web roadmap as a new block (B-WEB-10 or similar) or fold into existing block. Recommended placement: **add to web Block B5 (Export)** as it's structurally similar.

### Response shape

```typescript
{
  data: {
    snapshotVersion: "1.0",
    generatedAt: "2026-05-23T14:30:00Z",
    user: { /* full User excluding sensitive fields */ },
    themes: Theme[],  // user's + system themes
    calendarEvents: CalendarEvent[],
    calendarSettings: CalendarSettings,
    lists: List[],          // with fields, tags, items embedded
    notes: Note[],
    todoBoards: TodoBoard[], // with columns and items embedded
    habits: Habit[],         // with recent entries (last 90 days)
    financeBoards: FinanceBoard[], // with categories, transactions (last 365 days), budgets, wishlist, planned, goals embedded
    notificationConfigs: NotificationConfig[],
    notificationAttachments: { /* all attach tables, keyed by entity type */ },
  }
}
```

### Limits

- Max 50MB response. If user's data exceeds this, return partial snapshot with a flag indicating more pages are needed via per-module endpoints. (MVP: assume under 50MB; revisit if real users exceed.)
- Returns only first 365 days of transactions and habit entries. Older data fetched on-demand by the app when user navigates back in time.

### Implementation

A single service method `getSnapshotForUser(userId)` that runs ~12 parallel Prisma queries (`Promise.all`) and assembles the response.

## 5.3 · Device registration for FCM

### What

New endpoints to manage Android device tokens for push notifications.

### Endpoints

- `POST /devices/register` — body `{ token, platform: "android", deviceLabel?, userAgent? }`. Returns `{ id }`.
- `DELETE /devices/:id` — unregister.
- `GET /devices` — list current user's devices.

### Schema change

The existing `PushSubscription` table already has the right shape (after web Block B3 adds the device info fields). For Android, the existing fields suffice:

```prisma
model PushSubscription {
  id            String   @id @default(uuid())
  userId        String
  // For web push (existing):
  endpoint      String?  @unique
  p256dh        String?
  auth          String?
  // For FCM (new):
  fcmToken      String?  @unique
  platform      String?  // 'web' | 'android' | 'ios' (future)
  // Device metadata (already planned in web Block B3):
  userAgent     String?
  deviceLabel   String?
  lastUsedAt    DateTime?
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Add `fcmToken` and `platform` fields if not already present.

### Where in web roadmap

Goes into **web Block B3 (Notifications)** alongside existing PushSubscription changes.

### Backend behavior change

When delivering a push notification, the backend's NotificationsScheduler must:

1. Look up all `PushSubscription` rows for the user.
2. For rows with `platform === 'web'` → use existing web push (VAPID).
3. For rows with `platform === 'android'` → use FCM Admin SDK.

Implementation: split `PushDeliveryService` into `WebPushDelivery` and `FcmPushDelivery`, dispatched by platform.

### FCM Admin SDK setup

Backend needs:

- Firebase service account JSON file (downloaded from Firebase Console).
- `firebase-admin` npm package.
- Environment variables: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (or path to service-account.json).

## 5.4 · `modifiedSince` query parameter on list endpoints

### What

Per-module GET list endpoints accept `?modifiedSince=<ISO 8601 timestamp>` and return only entities modified after that time (plus a `deleted` array listing IDs deleted since then).

### Why

Periodic refresh (every 5 min foreground) needs to fetch only deltas, not everything.

### Where in web roadmap

This is a **performance optimization, not blocking MVP**. The Android MVP can fall back to full refetch on every periodic sync.

**Move to web post-MVP**, label as "Wave 1 · Robustness".

For Android MVP, accept the inefficiency.

## 5.5 · Audio MIME type for `/uploads`

### What

The `/uploads` endpoint validates MIME types and currently allows `image/*`. Add `audio/mp4` (for voice notes recorded as `.m4a`).

### Why

Voice notes (B-AND-6).

### Where in web roadmap

Trivial change to existing upload validation. Add to web Block B6 (Obsidian import) for batching, or directly when implementing app integration.

### Implementation

```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mp4',  // NEW
];
```

Update max file size: audio can be larger than images. Suggested: 25 MB for audio (covers ~30 min recordings).

## 5.6 · Deep link target in push notification payload

### What

When the backend sends a push notification, include a `deepLink` field in the payload pointing to the target entity.

### Why

So the Android app can route to the right screen on notification tap.

### Where in web roadmap

Add to **web Block B3 (Notifications)** as a payload enhancement.

### Payload shape change

```typescript
// Current (FCM payload sent to device):
{
  notification: { title, body, icon },
  data: { /* arbitrary */ }
}

// With deep link:
{
  notification: { title, body, icon },
  data: {
    deepLink: "omnidesk://notes/abc-123-def-456",
    entityType: "note",
    entityId: "abc-123-def-456",
    notificationId: "uuid-of-NotificationConfig"
  }
}
```

The backend constructs `deepLink` based on `entityType` and `entityId`. Schema:

- Note: `omnidesk://notes/{id}`
- CalendarEvent: `omnidesk://calendar/events/{id}`
- TodoItem: `omnidesk://todos/items/{id}`
- Habit: `omnidesk://habits/{id}`
- ListItem: `omnidesk://lists/{listId}/items/{itemId}`
- WishlistItem: `omnidesk://wishlist/{id}`
- PlannedPurchase: `omnidesk://planned-purchases/{id}`
- SavingsGoal: `omnidesk://savings/{id}`

## 5.7 · Summary of backend changes to web roadmap

To keep the web roadmap (`ROADMAP.md`) in sync with this document, the following updates are required:

### Add to web §9 (Decision log):

- **D-027 · Backend accepts client-proposed UUIDs on entity creation.** (§5.1 here.)

### Add to web §4 Block B0 (Sanitation):

- Subtask: "Refactor all POST creation endpoints to accept optional `id` UUID in request body. Validate uniqueness, return 409 on collision." (§5.1 here.)

### Add to web §4 Block B3 (Notifications):

- Subtask: "Add `fcmToken` and `platform` fields to PushSubscription if not present. Implement FCM Admin SDK integration. Backend's PushDeliveryService dispatches by platform." (§5.3 here.)
- Subtask: "Push notification payload includes `deepLink`, `entityType`, `entityId` fields." (§5.6 here.)

### Add to web §4 Block B5 (Export):

- Subtask: "New endpoint `GET /sync/snapshot` returning user's full data in single payload, used by Android app for initial sync." (§5.2 here.)

### Add to web §4 Block B6 (Obsidian import) — minor:

- Subtask: "Update `/uploads` allowed MIME types to include `audio/mp4`. Increase max size for audio uploads to 25 MB." (§5.5 here.)

### Move to web post-MVP §8:

- "`modifiedSince` query parameter on all list endpoints for delta sync." (§5.4 here.)

---

# §6 · Test plan

> This section defines **what to test, at what level, with what coverage** for the Android app. Same pragmatic approach as the web roadmap: protect critical invariants, not chase 100% coverage.

## 6.1 · Test levels

### 6.1.1 · Unit tests (JUnit 5 + MockK)

For **pure functions, mappers, and small isolated logic**. Located in `app/src/test/`. Run on JVM, no emulator needed. Fast.

What to unit-test:

- **Mappers** (DTO ↔ Entity ↔ Domain) — easy, high-value.
- **Repositories** (with mocked API and in-memory Room) — verifies sync logic.
- **Use cases** (with mocked repositories).
- **ViewModels** (with mocked use cases, Turbine for Flow).
- **Pure utils** (date formatting, validation, etc.).

### 6.1.2 · Integration tests (Room in-memory + MockWebServer)

For **multi-component flows**: API → mapper → repository → DAO. Located in `app/src/test/` (still JVM, since Room supports in-memory on JVM).

What to integration-test:

- **Sync engine** end-to-end with mocked API responses.
- **Offline creation** flow: create offline, mock network back, verify push.
- **Token refresh** on 401: MockWebServer returns 401, then 200 on refresh, then original request retried.

### 6.1.3 · UI tests (Compose UI Test)

For **screen interactions and navigation**. Located in `app/src/androidTest/`. Runs on emulator, slower.

What to UI-test (selective):

- **Auth flows:** login, register, 2FA. Critical because they're the entry point.
- **Notes flow:** list, create, edit, delete.
- **Offline indicator:** simulate offline state, verify banner.
- **Sync conflict handling:** create offline, simulate 409 on push, verify retry.

### 6.1.4 · Manual tests on physical device

For **device-specific behavior** that emulators don't replicate:

- Camera capture quality.
- Voice note transcription accuracy.
- Push notification delivery (FCM doesn't fire reliably on emulators).
- Share intent from real apps (Chrome, WhatsApp, Gallery).
- App size and install behavior from Play Store.

Performed before every release.

## 6.2 · Non-negotiable tests

These tests **must exist and pass** for MVP DoD:

### 6.2.1 · Multi-tenant safety on logout

```kotlin
@Test
fun `logout clears all cached user data from Room`() = runTest {
    // Login as user A, sync data
    // Verify Room contains user A's notes
    authRepository.logout()
    // Verify Room is empty
    assertThat(noteDao.getAll().first()).isEmpty()
}

@Test
fun `login as different user does not show previous user data`() = runTest {
    // Login as user A, sync, verify data
    // Logout
    // Login as user B, sync, verify only user B's data
    val notesB = noteDao.getAll().first()
    notesB.forEach { assertThat(it.userId).isEqualTo(userB.id) }
}
```

### 6.2.2 · Offline creation and sync

```kotlin
@Test
fun `note created offline syncs on network reconnect`() = runTest {
    // Simulate offline
    val note = notesRepository.create(title = "Offline note")
    assertThat(note.syncStatus).isEqualTo(SyncStatus.PENDING_CREATE)
    assertThat(noteDao.getById(note.id).syncStatus).isEqualTo(SyncStatus.PENDING_CREATE)
    
    // Simulate network back
    mockWebServer.enqueue(MockResponse().setResponseCode(201)
        .setBody(""" {"data": {"id": "${note.id}", "title": "Offline note", ...}} """))
    syncEngine.pushPending()
    
    assertThat(noteDao.getById(note.id).syncStatus).isEqualTo(SyncStatus.SYNCED)
}

@Test
fun `editing offline-created entity is allowed`() = runTest {
    // Create offline
    val note = notesRepository.create(title = "v1")
    // Edit offline (still createdLocally)
    notesRepository.update(note.id, title = "v2")
    assertThat(noteDao.getById(note.id).title).isEqualTo("v2")
}

@Test
fun `editing synced entity offline shows error`() = runTest {
    // Setup: note is SYNCED
    // Simulate offline
    val result = notesRepository.update(syncedNote.id, title = "newTitle")
    assertThat(result).isInstanceOf(OfflineEditNotAllowedError::class.java)
}
```

### 6.2.3 · Token refresh on 401

```kotlin
@Test
fun `401 on api triggers refresh and retries`() = runTest {
    // MockWebServer: enqueue 401, then 200 on /auth/refresh, then 200 on original
    mockWebServer.enqueue(MockResponse().setResponseCode(401))
    mockWebServer.enqueue(MockResponse().setBody(""" {"data": {"accessToken": "new", "refreshToken": "new"}} """))
    mockWebServer.enqueue(MockResponse().setBody(""" {"data": [...]} """))
    
    val result = notesRepository.fetchAll()
    
    assertThat(result.isSuccess).isTrue()
    assertThat(tokenStorage.getAccessToken()).isEqualTo("new")
}

@Test
fun `refresh token expired sends user to login`() = runTest {
    mockWebServer.enqueue(MockResponse().setResponseCode(401))  // original
    mockWebServer.enqueue(MockResponse().setResponseCode(401))  // refresh also 401
    
    val result = notesRepository.fetchAll()
    
    assertThat(result.isFailure).isTrue()
    assertThat(tokenStorage.getAccessToken()).isNull()
    // Navigation: verify navigated to Login (in integration test)
}
```

### 6.2.4 · Initial sync correctness

```kotlin
@Test
fun `snapshot endpoint populates all modules`() = runTest {
    mockWebServer.enqueue(MockResponse().setBody(loadFixture("snapshot-typical-user.json")))
    
    syncEngine.initialSync()
    
    assertThat(noteDao.getAll().first()).hasSize(47)
    assertThat(eventDao.getAll().first()).hasSize(132)
    assertThat(listDao.getAll().first()).hasSize(6)
    // ... etc
}

@Test
fun `fallback to per-module fetches works if snapshot unavailable`() = runTest {
    mockWebServer.enqueue(MockResponse().setResponseCode(404))  // snapshot 404
    // Per-module mocks
    repeat(10) { mockWebServer.enqueue(MockResponse().setBody(...)) }
    
    syncEngine.initialSync()
    
    // Verify all modules populated
}
```

### 6.2.5 · Deep link navigation

```kotlin
@Test
fun `deep link to note opens note editor`() {
    composeTestRule.activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("omnidesk://notes/abc-123")))
    composeTestRule.waitForIdle()
    composeTestRule.onNodeWithTag("NoteEditorScreen").assertIsDisplayed()
}
```

## 6.3 · Coverage targets

Same tiered approach as web:

| Layer | Target | Why |
|-------|--------|-----|
| Mappers | **95%+** | Pure, easy, high-value |
| Repositories | **75%+** | Sync logic bugs are painful |
| ViewModels | 60%+ | UI logic |
| Composables (UI) | 30%+ | Hard to test |
| Sync engine | **90%+** | Single most critical component |
| Pure utils | 80%+ | Easy |

## 6.4 · CI/CD pipeline

Same monorepo CI workflow extended with Android job:

```yaml
android:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '21'
    - uses: android-actions/setup-android@v3
    - run: cd android && ./gradlew test
    - run: cd android && ./gradlew assembleDevDebug
    - uses: actions/upload-artifact@v4
      with:
        name: debug-apk
        path: android/app/build/outputs/apk/dev/debug/*.apk

android-ui:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with: { distribution: 'temurin', java-version: '21' }
    - uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 35
        target: google_apis
        arch: x86_64
        script: cd android && ./gradlew connectedDevDebugAndroidTest
```

UI tests on emulator are slow (~10 min). Run on PR merge to main, not every commit.

## 6.5 · Manual test checklist (per release)

Before promoting from Internal Testing to Production:

- [ ] Cold launch <2s on Pixel 6a equivalent.
- [ ] Login flow with 2FA on real device.
- [ ] Create a note offline (airplane mode), reconnect, verify sync.
- [ ] Take photo, attach to note, verify upload.
- [ ] Record voice note, verify transcription appears.
- [ ] Share text from Chrome → OmniDesk → create note.
- [ ] Receive a push notification from a configured reminder, tap to deep link.
- [ ] Change theme, verify it persists across app restart.
- [ ] All 8 modules' basic CRUD work end-to-end.
- [ ] Sign out, sign in as different user, verify no data leakage.
- [ ] App handles airplane mode toggle gracefully (no crashes).
- [ ] App handles device rotation on all screens.
- [ ] TalkBack walkthrough of home, notes, calendar.
- [ ] App size APK <30 MB.

## 6.6 · What is NOT tested

Acknowledged gaps:

- **Cross-Android-version testing** — only Pixel 7 emulator API 35 + author's real device. Play Console pre-launch report covers more device models partially.
- **Network conditions (3G, lossy)** — not simulated explicitly. Manual airplane mode toggle is the proxy.
- **Battery drain over time** — not measured. Reliance on bounded background work (WorkManager) and FCM (no polling) as design guarantee.
- **Memory leaks** — not actively profiled in MVP. LeakCanary added post-MVP if user reports memory issues.

---

# §7 · MVP Definition of Done

> Consolidated checklist for the Android app to be considered MVP-complete and published to Play Store production.

## 7.1 · Code health

- [ ] All code in English (Kotlin convention).
- [ ] No `TODO` or `FIXME` comments in committed code without a corresponding GitHub issue.
- [ ] Hilt graph compiles cleanly.
- [ ] R8 release build runs without crashes.
- [ ] APK size <30 MB.
- [ ] All strings externalized to `strings.xml` (no hardcoded user-facing text in Composables).
- [ ] All Composables annotated `@Composable` with proper imports.
- [ ] No deprecated APIs used (lint clean).

## 7.2 · Architecture

- [ ] MVVM pattern followed consistently.
- [ ] Hilt injects dependencies into ViewModels, Repositories, Services.
- [ ] Room database has migration history for any schema changes.
- [ ] Retrofit + OkHttp + interceptors fully configured.
- [ ] EncryptedSharedPreferences stores all tokens.
- [ ] Sync engine handles offline creation and reconnect push.
- [ ] All ViewModels expose `StateFlow<UiState>`, not raw mutable state.

## 7.3 · Auth

- [ ] Register flow works with captcha (Cloudflare Turnstile or hCaptcha via WebView).
- [ ] T&C and no-data-selling checkboxes required.
- [ ] Email verification flow works (link from email opens app, calls API).
- [ ] Login with email + password.
- [ ] Login with 2FA TOTP works (real authenticator app codes).
- [ ] Backup code login works once and is consumed.
- [ ] Forgot password → email link → reset works.
- [ ] Auto-refresh on 401 transparent to user.
- [ ] Refresh expiry sends to login.
- [ ] Logout clears all state.

## 7.4 · All 8 modules

- [ ] **Notes:** list, view, create, edit, delete; rich text editor; tag system; pin/unpin; cover image upload; pagination if >50 notes.
- [ ] **Calendar:** month, week, agenda views; create, edit, delete events; settings (firstDay, defaultView).
- [ ] **Lists:** view all lists, view items in selected layout (6 view types), create/edit list, create/edit items with all 9 custom field types, tag system.
- [ ] **TODO Kanban:** view board, drag-drop within column, create/edit/delete items, mark as complete column.
- [ ] **Habits:** today's habits home view, tap to toggle, detail screen with heatmap and stats, create/edit habits.
- [ ] **Finance:** dashboard with charts, transactions list with filters, create/edit transactions, budgets, categories, organizer (wishlist, planned, savings).
- [ ] **Themes:** view system + custom themes, activate any, app re-themes immediately.
- [ ] **Notifications:** configure NotificationConfigs, attach to all 8 entity types, push delivery works end-to-end.

## 7.5 · Sync

- [ ] Initial sync from `/sync/snapshot` populates all modules.
- [ ] Periodic refresh on foreground (>5min stale) updates data.
- [ ] Offline creation for all entity types (where applicable).
- [ ] Pending entities visible with subtle indicator.
- [ ] Network reconnect triggers sync, entities pushed in order.
- [ ] Sync failures logged to Sentry, banner shown to user.
- [ ] 409 collision on UUID handled by regenerating and retrying.

## 7.6 · Mobile-specific features

- [ ] Camera capture from note editor and wishlist editor.
- [ ] Voice note recording with on-device transcription via SpeechRecognizer.
- [ ] Audio playback for recorded voice notes.
- [ ] Share intent: `text/plain` and `image/*` from other apps create notes.
- [ ] Push notifications delivered via FCM.
- [ ] Tapping notification deep-links to entity.

## 7.7 · Performance

- [ ] Cold start <2s on Pixel 6a equivalent.
- [ ] Lists scroll at 60fps with 100+ items.
- [ ] Image loading uses Coil cache (cached images appear instantly).
- [ ] Initial sync of typical user (<5MB data) completes in <10s.

## 7.8 · UX

- [ ] All screens have empty states with CTA.
- [ ] All screens have loading states.
- [ ] All error states are friendly (no stack traces).
- [ ] Material 3 motion is used consistently.
- [ ] Dark mode works correctly (follows system or app preference).
- [ ] All taps have visible feedback.
- [ ] Long-press shows context menu where applicable.

## 7.9 · Accessibility

- [ ] All interactive elements have `contentDescription`.
- [ ] Touch targets ≥48×48 dp.
- [ ] Text scaling up to 200% doesn't break layouts.
- [ ] TalkBack walkthrough is coherent for main screens.

## 7.10 · Telemetry and crash reporting

- [ ] Sentry SDK integrated; crashes reported.
- [ ] Source maps uploaded on release builds.
- [ ] PII scrubbing: no emails, no JWTs, no entity content in reports.
- [ ] Crash-free rate >99% over a 7-day Sentry test period.
- [ ] No analytics SDKs.

## 7.11 · Security

- [ ] HTTPS-only in release builds (NetworkSecurityConfig).
- [ ] JWT stored in EncryptedSharedPreferences.
- [ ] No sensitive data in logs.
- [ ] Permissions requested only when needed (rationale shown before system prompt).

## 7.12 · Play Store

- [ ] App published in Play Store under name "OmniDesk".
- [ ] Listing has: icon, feature graphic, 8 screenshots, full description.
- [ ] Privacy policy URL set.
- [ ] Terms URL set.
- [ ] Data safety form accurately filled.
- [ ] Pre-launch report passes.
- [ ] Internal Testing track active; author confirmed installation works.
- [ ] Production track promoted from Internal Testing.

## 7.13 · Tests

- [ ] Multi-tenant safety tests pass.
- [ ] Offline creation tests pass.
- [ ] Token refresh tests pass.
- [ ] Initial sync tests pass.
- [ ] Deep link tests pass.
- [ ] CI green on monorepo's main branch (backend + web + android all build).
- [ ] Manual test checklist (§6.5) completed before promotion to production.

## 7.14 · Documentation

- [ ] `android/README.md` explains how to build and run.
- [ ] Backend `.env.example` updated with FCM variables.
- [ ] CHANGELOG entry for the Android release.

## 7.15 · Backend changes deployed

- [ ] D-027 (client-proposed UUIDs) deployed in backend.
- [ ] `/sync/snapshot` endpoint deployed.
- [ ] FCM integration deployed.
- [ ] Deep link payload deployed.
- [ ] Audio MIME type added.

## 7.16 · Dogfooding criterion

- [ ] **The author has been using the Android app as their primary mobile organizer for 30+ consecutive days**, not just opening it to test.

## 7.17 · Sign-off

When all boxes checked, MVP is declared. Tag release `android/v1.0.0`. Write release notes (in CHANGELOG.md). Promote to Play Store production.

---

# §8 · Post-MVP

> Things explicitly **not** in Android MVP, grouped by wave. Order between waves suggestive, order within a wave technical.

## 8.1 · Wave 1 · Robustness

### 8.1.1 · Delta sync via `modifiedSince`

- Backend `modifiedSince` query parameter on list endpoints (§5.4).
- Android app uses delta instead of full refetch on periodic refresh.
- Performance improvement, lower data usage.

### 8.1.2 · Conflict resolution for offline edits (limited expansion)

- Allow editing of **owned-by-user, no-references** entities offline (e.g., note title, transaction amount).
- Last-write-wins resolution server-side.
- Bounded scope: never offline-edit relationships, never offline-delete-then-recreate, never offline-move.

### 8.1.3 · Background sync improvements

- WorkManager periodic worker syncs even when app is closed (battery-aware).
- Configurable sync frequency in settings (15 min, hourly, only on Wi-Fi).

### 8.1.4 · LeakCanary integration

- Detect memory leaks during development.
- Disabled in release builds.

### 8.1.5 · Baseline profiles

- Generate baseline profile for cold-start optimization.
- Cold start drops to <1s on supported devices.

## 8.2 · Wave 2 · Mobile UX richness

### 8.2.1 · Home screen widgets

- Today's events widget.
- Today's habits widget.
- Quick note widget (tap to start writing).
- Quick transaction widget.

### 8.2.2 · Quick actions (app icon long-press)

- "New note" shortcut.
- "New transaction" shortcut.
- "Voice note" shortcut.

### 8.2.3 · Biometric lock

- App-level lock with fingerprint/face.
- Configurable timeout (immediate, 1min, 5min, never).
- Disable via password.

### 8.2.4 · Dynamic colors (Material You)

- Optional setting to override active theme with system dynamic colors.
- Only on Android 12+.

### 8.2.5 · Tablet-optimized layouts

- Master-detail layouts on tablets.
- Side panels in landscape.

### 8.2.6 · Better drag and drop

- Drag between TODO columns (currently MVP only within column).
- Drag to reorder lists, habits, themes.

## 8.3 · Wave 3 · Smart features

### 8.3.1 · Receipt OCR

- Capture receipt photo → app extracts amount, date, merchant → pre-fills transaction.
- Uses Google ML Kit Text Recognition (on-device).

### 8.3.2 · Smart note suggestions

- "You mentioned a date — create event?" inline suggestion.
- "You wrote a list of items — convert to list?" suggestion.
- All on-device, no LLM calls.

### 8.3.3 · Calendar system integration

- Read-only sync from Google Calendar / system calendar (post Wave 2 of web roadmap that adds CalDAV).
- View only; events not editable from OmniDesk.

### 8.3.4 · Cross-app linking

- Tasker / IFTTT-style integration via Android intents.
- Other apps can create notes/events in OmniDesk via intent.

## 8.4 · Wave 4 · Security and privacy hardening

### 8.4.1 · SQLCipher encryption for Room

- Local DB encrypted at rest.
- User-managed master key (PIN or biometric).

### 8.4.2 · Certificate pinning

- Pin backend's certificate (omnidesk.app and self-hosted instances).
- Configurable for forks.

### 8.4.3 · App attestation

- Use Play Integrity API to verify the app is genuine.
- Backend can reject requests from tampered APKs.

### 8.4.4 · End-to-end note encryption (post-MVP, ambitious)

- Optional setting: notes encrypted with user-derived key before upload.
- Backend stores ciphertext only.
- Trade-off: search becomes harder. Maybe a separate "secret notes" feature.

## 8.5 · Wave 5 · Internationalization

Same trigger as web Wave 6: when web adds i18n, Android follows.

- `res/values-es/strings.xml`, `res/values-pt/strings.xml`.
- Date/time formats locale-aware.
- Pluralization rules.

## 8.6 · Wave 6 · Voice-driven UX

### 8.6.1 · Voice commands

- "Hey OmniDesk, new note" → app opens to voice note recorder.
- Via Google Assistant intents.

### 8.6.2 · Better transcription

- If on-device transcription is low quality, send to backend for higher-quality transcription (paid Whisper API or self-hosted).
- User opt-in per voice note.

## 8.7 · What is explicitly NOT planned for Android, ever

Restating for emphasis:

- **No iOS.** Permanent unless author acquires Mac and changes mind.
- **No Wear OS, Android Auto, Android TV.**
- **No social auth.**
- **No analytics SDKs.**
- **No in-app purchases or subscriptions.**
- **No cross-account collaboration.**
- **No plugin system.**

---

# §9 · Decision log

> Registry of Android-specific decisions. Numbered `D-AND-XXX` to distinguish from web decisions. Same template as web `ROADMAP.md` §9.

## 9.1 · Active decisions

---

### D-AND-001 · Android-only, no iOS
- **Date:** 2026-05
- **Status:** Active
- **Decision:** OmniDesk app is Android-only. iOS is explicitly out of scope.
- **Context:** Native iOS development requires Xcode, which requires macOS. The author does not have a Mac and does not plan to purchase one.
- **Alternatives considered:**
  - Cross-platform framework (React Native, Flutter) — rejected, see D-AND-003.
  - PWA-only — rejected, web push notifications have limitations on iOS.
  - Purchase Mac and develop both — rejected, time and budget constraints.
- **Reason for choice:** Aligns with project resources and prioritizes depth on Android over breadth across both platforms.
- **Consequences:** OmniDesk has no iOS presence. iPhone users use the web app.
- **Revisit if:** Author acquires Mac access (personal Mac, cloud Mac service, or partner with iOS developer).

---

### D-AND-002 · Feature parity with web mandatory
- **Date:** 2026-05
- **Status:** Active
- **Decision:** The Android app implements all 8 modules of OmniDesk, not a reduced subset.
- **Context:** Could ship Android with a mobile-only subset (notes, quick capture, dashboard) and leave heavy modules to web.
- **Alternatives considered:** Mobile-first reduced subset; paridad selectiva (partial parity).
- **Reason for choice:** OmniDesk is one product on three surfaces. A user who switches between web and mobile expects the same data and the same operations. Reducing scope on mobile creates friction.
- **Consequences:** Android development effort is larger. Some modules (lists with custom fields, finance dashboards) require careful mobile UX work.
- **Revisit if:** Specific module proves unusable on mobile despite UX effort — then degrade gracefully (e.g., list custom fields editable only on web, viewable on Android).

---

### D-AND-003 · Native Kotlin + Compose, not cross-platform
- **Date:** 2026-05
- **Status:** Active
- **Decision:** Android app built with native Kotlin + Jetpack Compose. No React Native, no Flutter, no Capacitor, no KMP.
- **Context:** Cross-platform options were considered. The decision was driven by "where OmniDesk will be best" rather than developer convenience.
- **Alternatives considered:**
  - React Native — code sharing with web reduced because web is Angular, not React.
  - Flutter — would require learning Dart; not justifiable here.
  - Capacitor — wrap existing web in native shell; performance and feel inferior.
  - Kotlin Multiplatform — share business logic between iOS and Android. Since iOS is out (D-AND-001), no benefit.
- **Reason for choice:** Native gives best performance, best feel, best access to platform features (camera, voice, notifications, file system). For a project where quality matters and dev resources are owned by one person, depth on one platform > breadth across two.
- **Consequences:** Single codebase, single language, all in Kotlin. Reimplementation of UI from scratch.
- **Revisit if:** Project goals shift toward maximum reach over quality.

---

### D-AND-004 · Online-first with bounded offline creation
- **Date:** 2026-05
- **Status:** Active
- **Decision:** App is online-first. Read cache enables offline viewing. Offline writes restricted to **creation** of new entities only (no edits to synced entities, no deletes, no reorders).
- **Context:** Full offline sync with conflict resolution would dominate the sync engine's complexity.
- **Alternatives considered:**
  - Full offline-first with CRDT/last-write-wins resolution.
  - Pure online-first (no cache, requires network always).
  - Read cache only (no offline writes at all).
- **Reason for choice:** This split eliminates conflicts (creations are independent), keeps the sync engine simple, gives the user a useful offline experience (capture thoughts on the go).
- **Consequences:** Some operations require network: editing an existing note, marking a synced TODO done, reordering. UI must clearly indicate when an operation requires connection. Some scenarios remain online-only.
- **Revisit if:** Users frequently complain about specific offline restrictions and a bounded extension can be added (Wave 1 expansion in §8).

---

### D-AND-005 · Sentry only for telemetry
- **Date:** 2026-05
- **Status:** Active
- **Decision:** Sentry for crash reporting. No analytics SDK (no Firebase Analytics, no Mixpanel, no Amplitude).
- **Context:** Mobile apps often include multiple telemetry SDKs by default.
- **Alternatives considered:** Adding Firebase Analytics for usage data.
- **Reason for choice:** Privacy commitment of OmniDesk (D-013 from web). Crash reporting is needed to diagnose problems; usage analytics is invasive and unnecessary.
- **Consequences:** No data on which features are used most. Decisions about feature prioritization rely on user feedback and dogfooding.
- **Revisit if:** Anonymous, opt-in, fully transparent usage telemetry becomes valuable (post-MVP if at all).

---

### D-AND-006 · On-device speech recognition with backend fallback
- **Date:** 2026-05
- **Status:** Active
- **Decision:** Voice note transcription uses Android `SpeechRecognizer` (on-device) when available. Falls back to backend-side transcription (post-MVP Wave 6).
- **Context:** Voice notes need transcription. Two options: on-device or send audio to backend.
- **Alternatives considered:** Always-backend transcription (higher quality, but privacy concern + latency).
- **Reason for choice:** Privacy + low latency. On-device is fast and doesn't share audio with any server. Quality is adequate for most spoken language.
- **Consequences:** Transcription quality is lower than backend Whisper would provide. Some languages have limited on-device support.
- **Revisit if:** On-device transcription quality is consistently poor and users want better.

---

### D-AND-007 · No tablet-specific UI in MVP
- **Date:** 2026-05
- **Status:** Active
- **Decision:** App functions on tablets (Compose adapts) but no special tablet treatment (no master-detail, no two-pane).
- **Context:** Tablet users might want more screen real estate utilized.
- **Alternatives considered:** Design for tablets from start.
- **Reason for choice:** Author owns phone, not tablet. Designing without dogfooding is risky. Wait for user demand.
- **Consequences:** Tablet experience is "large phone". Acceptable for MVP.
- **Revisit if:** Significant tablet user base emerges (Wave 2).

---

### D-AND-008 · Compose Rich Editor library for notes
- **Date:** 2026-05
- **Status:** Active
- **Decision:** Use `com.mohamedrejeb.richeditor:richeditor-compose` for note editing on Android.
- **Context:** Web uses TipTap (web-only). Need a Compose-compatible rich text editor.
- **Alternatives considered:**
  - Build custom editor from `BasicTextField` — too much work.
  - Use WebView with TipTap embedded — violates "no WebView" principle (D-AND-003).
  - Plain markdown text input — loses rich features.
- **Reason for choice:** Most actively maintained Compose-native rich editor. Supports Markdown export, headings, bold, italic, lists, code blocks, links.
- **Consequences:** Some advanced TipTap features (custom blocks, embeds) won't have equivalent on Android. Web-created complex notes display with simplification on Android.
- **Revisit if:** Library becomes unmaintained or a better option emerges.

---

### D-AND-009 · Client-generated UUIDs for all creations
- **Date:** 2026-05
- **Status:** Active
- **Decision:** The Android app generates UUIDs client-side for all entity creations (online or offline). Backend accepts client-proposed UUIDs.
- **Context:** Offline creation requires entities to have IDs before they reach the server.
- **Alternatives considered:** Use temporary local IDs and remap after sync — more complex.
- **Reason for choice:** Standard pattern in modern offline-capable apps. Eliminates tempId/realId remapping. Backend change is small (accept optional `id` in DTOs, fall back to default).
- **Consequences:** Backend Block B0 includes refactor to accept client UUIDs (D-027 in web). All POST endpoints affected.
- **Revisit if:** Never expected to.

---

### D-AND-010 · 2FA flow mirrors web; app is not an authenticator
- **Date:** 2026-05
- **Status:** Active
- **Decision:** When user has 2FA enabled, login on Android prompts for TOTP code. User obtains code from their existing authenticator app (Google Authenticator, Authy, etc.). The OmniDesk app does not generate codes itself in MVP.
- **Context:** Mobile apps could double as authenticators.
- **Alternatives considered:** Make the app function as its own authenticator (would be circular if same device).
- **Reason for choice:** Consistent with web's flow. Avoids the circular problem of "the app I'm logging into is also the second factor". User keeps separation of factors.
- **Consequences:** Users with 2FA enabled need a separate authenticator app. Standard practice.
- **Revisit if:** Want OmniDesk to function as a general-purpose TOTP store for other accounts (separate feature, not 2FA).

---

### D-AND-011 · Share intent supports text and images, not arbitrary types
- **Date:** 2026-05
- **Status:** Active
- **Decision:** Android share intent filters: `text/plain` and `image/*` only. PDFs, videos, audio, arbitrary files not handled in MVP.
- **Context:** Could open share intent to any MIME type.
- **Alternatives considered:** Accept any MIME type, attach to note.
- **Reason for choice:** Text and images cover 95% of share use cases. PDFs and videos are heavier and require more thought (where do they go, what's the storage cost). MVP-bounded.
- **Consequences:** Sharing a PDF from another app won't show OmniDesk as a target.
- **Revisit if:** Real users ask for PDF share (Wave 3).

---

### D-AND-012 · Single Activity architecture
- **Date:** 2026-05
- **Status:** Active
- **Decision:** App has one `MainActivity` (and one `ShareReceiverActivity` for share intent). All screens are Composables navigated via Compose Navigation.
- **Context:** Old Android used multiple Activities; modern best practice is single Activity.
- **Alternatives considered:** Multiple Activities per feature.
- **Reason for choice:** Compose Navigation is the modern pattern. Single Activity simplifies lifecycle, deep links, view models.
- **Consequences:** All deep links flow through `MainActivity`. Share intent has its own Activity for technical reasons (must be exported and accept incoming intents).
- **Revisit if:** Some screen needs a different activity context (unlikely).

---

## 9.2 · Discarded / considered ideas

### Cross-platform framework (React Native, Flutter)
- **Rejected:** D-AND-003. Native fits OmniDesk's quality bar better.

### iOS development
- **Rejected:** D-AND-001. Resource constraints.

### Building app as a full TipTap port
- **Rejected:** Too much effort. Use Compose Rich Editor (D-AND-008) and accept some feature simplification.

### Analytics SDKs
- **Rejected:** D-AND-005. Privacy principle.

### Background polling for notifications
- **Rejected:** Battery drain. FCM is the standard, more efficient, and pre-installed.

### Local-only notifications (AlarmManager)
- **Rejected for MVP:** Adds duplication of scheduling logic. All notifications go through backend → FCM. Post-MVP if offline notification precision becomes valuable.

### Multi-account support (switch accounts)
- **Rejected for MVP:** Anti-goal of multi-tenant complexity in app. One account per app install. Logging out and back in works for account switching, though clears cache.

### WebView for embedded content
- **Rejected:** D-AND-003. Native throughout.

---

## 9.3 · How to add a new decision

Same process as web:

1. Pick next `D-AND-XXX` number.
2. Fill the template.
3. Commit `decision(android): D-AND-XXX <short description>`.
4. Update any related sections.

When deprecating an active decision, change status to `Deprecated (replaced by D-AND-YYY)`. Never delete.

---

# §10 · Developer setup appendix

> Step-by-step guide for setting up the Android development environment from scratch. Written to be followed once, then forgotten.

## 10.1 · Operating system

Works on:

- **Windows 10 or 11** (recommended for this project given the author's setup).
- **Linux** (Ubuntu 22.04+, Debian 12+, Fedora 38+, Arch).
- **macOS** (works but unnecessary since we're Android-only).

Minimum: 8 GB RAM, 30 GB free disk. Recommended: 16+ GB RAM, 50+ GB free disk, SSD.

## 10.2 · Install Android Studio

### Step 1 · Download

Go to `https://developer.android.com/studio`. Download the latest stable release. As of 2026, this is Android Studio Ladybug Feature Drop or later.

### Step 2 · Run installer

- **Windows:** run the `.exe`, follow installer. Accept all defaults.
- **Linux:** extract `.tar.gz` to `/opt/android-studio/`. Run `bin/studio.sh`.
- **macOS:** drag `.dmg` to Applications.

### Step 3 · First-run setup wizard

On first launch:

1. Choose "Standard" installation type.
2. Accept all licenses.
3. Wait while Android Studio downloads:
   - Android SDK (latest stable).
   - Android SDK Platform-Tools.
   - Android Emulator.
   - Initial system image.

This takes ~15-30 minutes depending on connection.

### Step 4 · Verify Java

Android Studio bundles a JDK (Embedded JBR 21). No manual Java installation needed. To verify:

- Open Android Studio → Settings → Build, Execution, Deployment → Build Tools → Gradle.
- "Gradle JDK" should show: "Embedded JBR version 21.x".

## 10.3 · Install Android SDK components

In Android Studio: Tools → SDK Manager.

### SDK Platforms tab

Check:

- ✅ Android 15 (API 35) — Platform.
- ✅ Android 10 (API 29) — Platform. (For minSdk testing.)
- (Optional) Android 14 (API 34) — for one intermediate testing target.

### SDK Tools tab

Check:

- ✅ Android SDK Build-Tools (latest).
- ✅ Android SDK Command-line Tools (latest).
- ✅ Android Emulator (latest).
- ✅ Android SDK Platform-Tools.
- ✅ Google Play services.

Click "Apply" to install. ~2 GB additional download.

## 10.4 · Create an Android Virtual Device (AVD)

In Android Studio: Tools → Device Manager → "Create Device".

### Recommended configuration

- **Phone:** Pixel 7.
- **System Image:** API 35 (Android 15), Google APIs (not Google Play — Google Play is for testing payment flows, Google APIs is faster).
- **AVD Name:** "Pixel 7 API 35".
- **Startup orientation:** Portrait.
- **Advanced settings:** RAM 2048 MB, VM Heap 256 MB, Internal Storage 6 GB.

Click "Finish". The emulator becomes available in the device dropdown.

### Second AVD for testing minSdk

To test on lower API levels, create a second AVD:

- Pixel 5, API 29 (Android 10), Google APIs.

## 10.5 · Configure environment variables (optional but recommended)

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, or Windows environment variables):

```bash
# Linux/macOS — adjust paths to your installation
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/emulator
```

```powershell
# Windows PowerShell — adjust paths
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\emulator"
```

This lets you run `adb`, `emulator`, `sdkmanager` from any terminal.

## 10.6 · Create the OmniDesk Android project

### Step 1 · From Android Studio's welcome screen

"New Project" → "Empty Activity" (Compose).

### Step 2 · Configure project

- **Name:** OmniDesk.
- **Package name:** `app.omnidesk`.
- **Save location:** `<path-to-monorepo>/OmniDesk/android/`.
- **Language:** Kotlin.
- **Minimum SDK:** API 29: Android 10 (Q).
- **Build configuration language:** Kotlin DSL (`build.gradle.kts`).

### Step 3 · Wait for initial sync

Android Studio downloads Gradle, configures the project. ~5 minutes.

### Step 4 · First build

Click the green "Run" button. App should launch on the AVD and show "Hello Android!".

If this works, environment is ready.

## 10.7 · Configure Gradle version catalog

Replace `gradle/libs.versions.toml` with the canonical version catalog for OmniDesk (will be drafted in B-AND-0). Sample structure:

```toml
[versions]
agp = "8.7.0"
kotlin = "2.0.20"
ksp = "2.0.20-1.0.25"
hilt = "2.52"
room = "2.6.1"
retrofit = "2.11.0"
kotlinx-serialization = "1.7.3"
compose-bom = "2024.10.00"
material3 = "1.3.0"
coil = "2.7.0"
sentry = "7.14.0"
# ... rest

[libraries]
androidx-core-ktx = "androidx.core:core-ktx:1.13.1"
androidx-lifecycle-runtime-ktx = "androidx.lifecycle:lifecycle-runtime-ktx:2.8.6"
# ... etc

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
# ... etc
```

Detailed catalog filled during B-AND-0.

## 10.8 · Connect a physical Android device (optional but recommended)

Emulators are slower than real devices for testing performance. To use your real Android phone:

### Step 1 · Enable Developer Options

On the phone: Settings → About phone → tap "Build number" 7 times. "You are now a developer!" appears.

### Step 2 · Enable USB debugging

Settings → System → Developer options → USB debugging: ON.

### Step 3 · Connect via USB

- Connect phone to computer.
- On phone: "Allow USB debugging from this computer?" → check "Always allow" → OK.
- In Android Studio device dropdown, your phone appears.

### Step 4 · Optionally use Wi-Fi debugging

Android 11+: Settings → Developer options → Wireless debugging. Pair via QR code. After paired, no USB needed.

## 10.9 · Register for Play Console (before B-AND-8)

- Go to `https://play.google.com/console`.
- Create a Google Play Developer account.
- Pay **$25 one-time** registration fee (credit card).
- Wait for account approval (usually instant, sometimes 24-48h).
- Once approved, you can publish apps.

**Do this before B-AND-8, not before B-AND-0.** No need to register early.

## 10.10 · Create Firebase project (before B-AND-5)

For push notifications via FCM:

### Step 1 · Create project

- Go to `https://console.firebase.google.com`.
- "Add project" → name: "OmniDesk".
- Disable Google Analytics for the project (privacy principle).

### Step 2 · Add Android app

- Inside the Firebase project → "Add app" → Android icon.
- **Package name:** `app.omnidesk`.
- App nickname: "OmniDesk Android".
- Optional: SHA-1 of your debug keystore (find via `./gradlew signingReport`).
- Download `google-services.json`.

### Step 3 · Place file

- Copy `google-services.json` to `android/app/google-services.json`.
- Add to `.gitignore` (it contains a project-specific key, though not a secret).

### Step 4 · Backend FCM service account

- In Firebase Console → Project settings → Service accounts → Generate new private key.
- Downloads `<project>-firebase-adminsdk-<id>.json`.
- This file goes to the backend (NOT the Android app). Store securely.
- Backend `.env`:
  ```
  FIREBASE_PROJECT_ID=omnidesk-xxxxx
  FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@omnidesk-xxxxx.iam.gserviceaccount.com
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  ```

## 10.11 · Sentry setup (before B-AND-7)

- Go to `https://sentry.io`. Sign up for free account.
- Create new project → Platform: Android.
- Copy DSN (Data Source Name) — looks like `https://abc123@o12345.ingest.sentry.io/67890`.
- Add to Android app's `build.gradle.kts` Sentry plugin config or as a `BuildConfig` field.

## 10.12 · Useful Android Studio plugins

Recommended (Settings → Plugins → Marketplace):

- **Compose Multiplatform IDE Support** — better Compose previews.
- **Kotlin** (usually pre-installed and up-to-date).
- **GitToolBox** — git annotations inline.
- **Rainbow Brackets** — colored bracket matching.
- **Key Promoter X** — learns shortcuts.

## 10.13 · Recommended shortcuts to learn

- **Find action:** Ctrl+Shift+A (Win/Linux) — anything you need is searchable here.
- **Search everywhere:** Shift+Shift — search files, classes, symbols.
- **Reformat code:** Ctrl+Alt+L.
- **Optimize imports:** Ctrl+Alt+O.
- **Run:** Shift+F10.
- **Debug:** Shift+F9.
- **Find usages:** Alt+F7.
- **Go to declaration:** Ctrl+B.

## 10.14 · Common first-time errors and fixes

### "SDK location not found"

→ Open `local.properties`, add `sdk.dir=/path/to/Sdk`. Don't commit this file.

### "Gradle sync failed: Could not download X"

→ Check internet, retry. If persistent, delete `~/.gradle/caches` and resync.

### "Emulator failed to start"

→ Check Tools → Device Manager → click "wipe data" on the AVD. Or recreate.

### "Build error: Kotlin version conflict"

→ Ensure `libs.versions.toml` has consistent Kotlin version across all dependencies.

## 10.15 · You're ready

After completing §10.1–§10.6, your environment is ready for B-AND-0.

§10.7–§10.11 are for later blocks; not needed on day one.

---

## Closing note

This document is the master plan for OmniDesk Android. It evolves with the project. Every significant decision is registered in §9. Every block is built per §4 and verified per §7.

When the day comes that the author has access to a Mac and wants iOS, the spec in this document — modulo §3.1 stack and §10 environment — is the seed for a parallel `ROADMAP_IOS.md`. The vision, the modules, the sync model, the parity discipline transfer directly.

Until then: Android, with discipline.

---

