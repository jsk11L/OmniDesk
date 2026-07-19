# OmniDesk Android (Capacitor) — Setup

The Android app is the **existing Angular PWA in a native shell** via
[Capacitor](https://capacitorjs.com), in **remote mode**: the WebView loads the
deployed Cloudflare Pages URL (`server.url`), so **every web deploy updates the
app instantly** — the APK is only rebuilt when the native shell changes
(plugins, config, icon). See `ROADMAP_ANDROID.md` for the phased plan and the
recorded decisions.

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
# One build so webDir exists (the CLI requires it; remote mode ignores those
# assets at runtime — the app loads the deployed site):
API_URL=https://omnidesk-api-kwjj.onrender.com pnpm --filter frontend build:cloud

# Create the native project in ./android:
npx cap add android
```

Make sure `capacitor.config.ts` has the remote server block pointing at the
real Pages URL BEFORE building the APK:

```ts
server: { url: 'https://<YOUR-APP>.pages.dev' }
```

## 4. Develop / update

- **Web changes** (features, fixes): nothing to do — deploy the web as always,
  the app picks it up on next load.
- **Native shell changes** (config, plugins, icons):

```bash
npx cap sync android
pnpm android:open        # opens Android Studio → Run ▶
```

## 5. App icon & splash

The brand icon lives at `frontend/src/assets/icons/icon.svg`. Generate Android
densities with Capacitor's asset tool:

```bash
pnpm add -D @capacitor/assets
# put a 1024×1024 icon.png (and optional splash.png) in ./assets first
npx capacitor-assets generate --android
```

## 6. App identity

- **appId:** `app.omnidesk` — the permanent package identity (Play Store id if
  ever published). Change it in `capacitor.config.ts` BEFORE `cap add`; after
  installing, changing it means installing a different app.
- **appName:** `OmniDesk`.

## 7. Release (sideload)

Android Studio → **Build → Generate Signed APK** with your keystore
(⚠️ back the keystore up OUTSIDE the repo — losing it means you cannot update
the installed app). Install the APK on the phone. Re-release is only needed
when the native shell changes.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cap: command not found` | Run via `npx cap …` or `pnpm android:open`. |
| White screen on launch | Check `server.url` in `capacitor.config.ts` is the real Pages URL and the device has network. |
| Slow first load (~50 s) | Render free-tier cold start — the API is waking up. Expected; see ROADMAP Fase 5 (keep-alive). |
| `webDir` not found during `cap add`/`sync` | Build the frontend once (`build:cloud`); `webDir` is `frontend/dist/frontend/browser`. |
| Styles/images broken in the app but fine on web | The WebView loads the same deployed site — check `frontend/src/_headers` CSP if the API/asset domain changed. |
