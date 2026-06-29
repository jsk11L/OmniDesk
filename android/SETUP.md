# OmniDesk Android (Capacitor)

The Android app is the **existing Angular PWA wrapped in a native shell** via
[Capacitor](https://capacitorjs.com) — one codebase, native packaging, Play Store
ready. This is the approach chosen in the roadmap (`ROADMAP_ANDROID.md`).

The repo already ships the Capacitor config (`capacitor.config.ts`) and deps
(root `package.json`). You run the commands below once to generate the native
project (`cap add android` creates the Gradle project here in `android/`).

> The web build that gets bundled must point at your **deployed API**, because
> the app runs the static files offline-first and calls the backend over HTTPS.
> So always build with `API_URL` set.

---

## 1. Prerequisites

- **Android Studio** (latest) with the Android SDK + an emulator or a device in
  USB-debugging mode.
- **JDK 17** (bundled with recent Android Studio).
- Node 20+ and pnpm (already used for the web app).

## 2. Install dependencies

```bash
pnpm install        # pulls @capacitor/core, @capacitor/cli, @capacitor/android
```

## 3. Generate the native Android project (once)

```bash
# Build the web app first so webDir exists, with the real API baked in:
API_URL=https://omnidesk-api-xxxx.onrender.com pnpm --filter frontend build:cloud

# Create the native project in ./android (alongside this README):
npx cap add android
```

## 4. Develop / update

Whenever the web app changes, rebuild + copy into the native project:

```bash
API_URL=https://omnidesk-api-xxxx.onrender.com pnpm android:sync
# (= build:cloud + cap sync android)

pnpm android:open        # opens Android Studio
```

In Android Studio press **Run ▶** to launch on the emulator/device. To ship,
use **Build → Generate Signed Bundle / APK** (AAB for the Play Store).

## 5. App icon & splash

The brand icon already exists at `frontend/src/assets/icons/icon.svg`. Generate
all Android densities with Capacitor's asset tool:

```bash
pnpm add -D @capacitor/assets
# put a 1024×1024 icon.png and (optional) splash.png in ./assets first
npx capacitor-assets generate --android
```

## 6. App identity

- **appId:** `app.omnidesk` — change in `capacitor.config.ts` BEFORE `cap add`
  if you want a different package name (e.g. `com.yourname.omnidesk`); it's the
  Play Store identity and hard to change later.
- **appName:** `OmniDesk`.

## 7. Native niceties (later)

- **Status bar / theme:** `@capacitor/status-bar` to match the app's dark theme.
- **Back button:** Capacitor maps Android back to browser history by default;
  add a guard so it doesn't exit the app from the root.
- **Push notifications:** `@capacitor/push-notifications` + FCM — the web app
  already has the notification system; native push is a follow-up.
- **Safe areas / keyboard:** `@capacitor/keyboard`, CSS `env(safe-area-inset-*)`
  (the app already uses `viewport-fit=cover`).

See `ROADMAP_ANDROID.md` in this folder for the full block-by-block plan.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cap: command not found` | Run via `npx cap …` or `pnpm android:sync` / `pnpm android:open`. |
| White screen on launch | The web build wasn't copied or `API_URL` was unset — re-run `pnpm android:sync` with `API_URL`. |
| API calls fail / CORS | Add the app's origin (`https://localhost` for Capacitor) to the backend `FRONTEND_URL`, or relax CORS for the native scheme. |
| `webDir` not found | Build the frontend first (`build:cloud`); `webDir` is `frontend/dist/frontend/browser`. |
