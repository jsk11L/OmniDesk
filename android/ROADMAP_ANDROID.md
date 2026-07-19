# OmniDesk Android · Plan de acción (Capacitor)

**Versión:** 2.0 · **Fecha:** 2026-07-19

> **Este documento reemplaza al roadmap anterior** (v1.0, mayo 2026: plan de
> app nativa en Kotlin + Jetpack Compose, ~2.800 líneas — recuperable en el
> historial de git). Aquella ruta implicaba un **segundo codebase completo** y
> 2-4+ meses hasta paridad de features. La decisión vigente es **Capacitor**:
> la PWA Angular existente envuelta en un shell nativo — un solo codebase,
> paridad inmediata con la web.

## Decisiones registradas (2026-07-19)

| Decisión | Elección | Motivo |
|---|---|---|
| Estrategia | **Capacitor remoto** (`server.url` → Cloudflare Pages) | Cada deploy web actualiza la app al instante; cero rebuilds de APK por cambio; CORS sin cambios (origin = pages.dev). La app ya es online-first. |
| Push nativo | **Diferido a Fase 3** | El web push no funciona dentro del WebView; el centro de notificaciones in-app ya existe. FCM es una fase propia, no un bloqueante de v1. |
| Distribución | **APK firmado, sideload personal** | Sin cuenta de Play, sin review. Migrable a Play Store después (el `appId` queda fijado desde ya: `app.omnidesk`). |

**Consecuencia clave del modo remoto:** el APK solo se rebuildea cuando cambia
el **shell nativo** (plugins, config, icono). Los cambios de la app web llegan
solos con cada deploy — mismo ritmo de trabajo que hoy.

---

## Fase 0 — Entorno (tu máquina, ~1 hora, una sola vez)

- [ ] Instalar **Android Studio** (incluye JDK 17 y el SDK manager).
- [ ] En el primer arranque: SDK Platform Android 14 (API 34) + Build-Tools.
- [ ] Teléfono en modo desarrollador con **depuración USB** (o crear un emulador).
- [ ] Confirmar `appId` en `capacitor.config.ts` (**`app.omnidesk`**) — es la
      identidad permanente del paquete; cambiarlo después de instalar implica
      reinstalar desde cero.

## Fase 1 — Primer APK funcional (1 sesión)

- [ ] `capacitor.config.ts`: añadir `server: { url: 'https://<TU-APP>.pages.dev' }`
      (la URL real de Cloudflare Pages — la misma que `FRONTEND_URL` en Render).
- [ ] Build único del frontend para que exista `webDir` (requisito de la CLI;
      en modo remoto esos assets no se usan en runtime):
      `pnpm --filter frontend build:cloud`.
- [ ] `npx cap add android` → genera el proyecto Gradle en `android/`.
- [ ] Iconos: `@capacitor/assets` con el brand icon (PNG 1024×1024 derivado de
      `frontend/src/assets/icons/icon.svg`) → `npx capacitor-assets generate --android`.
- [ ] Android Studio → Run ▶ en el dispositivo.

**Criterio de aceptación:** login funciona; los 8 módulos son usables; imágenes
externas (TMDB/Last.fm/OpenLibrary) cargan; el import de archivos abre el file
picker; subir una imagen desde la galería funciona.

## Fase 2 — Pulido nativo (1-2 sesiones)

- [ ] `@capacitor/status-bar`: color acorde al tema oscuro.
- [ ] **Botón atrás**: listener del App plugin — `history.back()` salvo en la
      raíz (ahí, confirmar salida o minimizar). Sin esto, "atrás" cierra la app.
- [ ] `@capacitor/keyboard`: modo resize correcto (que el editor de notas no
      quede tapado por el teclado).
- [ ] Safe areas: verificar `env(safe-area-inset-*)` con notch/gestos
      (`viewport-fit=cover` ya está en la PWA).
- [ ] Links externos (Letterboxd, RYM, TMDB…) → abrir en el navegador del
      sistema, no dentro del WebView.
- [ ] Splash screen con el brand.
- [ ] QA táctil por módulo: diálogos, kanban drag&drop, ruleta, calendario,
      import con revisión item-por-item.

## Fase 3 — Push nativo con FCM (2-3 sesiones, cuando se quiera)

- [ ] Proyecto Firebase + `google-services.json`.
- [ ] `@capacitor/push-notifications`, registrado solo si
      `Capacitor.isNativePlatform()` (la web conserva su web push intacto).
- [ ] Backend: tokens de dispositivo (extender `PushSubscription` o modelo
      nuevo) + envío vía `firebase-admin` en paralelo al web-push actual; env
      vars nuevas en Render.
- [ ] Frontend: registrar token al iniciar sesión, revocarlo al salir.

## Fase 4 — Release v1 (media sesión)

- [ ] Generar **keystore** y respaldarlo (⚠️ perderlo = imposible actualizar la
      app instalada; guardarlo FUERA del repo).
- [ ] Build → Generate Signed APK → instalar en el teléfono.
- [ ] Documentar el flujo de re-release (solo necesario si cambia el shell).

## Fase 5 — Opcionales futuros (sin orden)

- Play Store (AAB, USD 25 único, privacy policy + data safety form).
- Modo bundled + live-updates (Capgo) si algún día se quiere shell offline.
- Bloqueo biométrico al abrir la app.
- Share target (compartir URLs/texto desde otras apps hacia listas/notas).
- Keep-alive del backend para evitar el cold start de Render al abrir la app.

---

## Riesgos y notas técnicas

- **Cold start de Render (free tier):** la primera request tras ~15 min de
  inactividad tarda ~50 s — al abrir la app se percibe como carga lenta.
  Mitigable con keep-alive (Fase 5) o plan pago.
- **CSP (`frontend/src/_headers`)** aplica también dentro del WebView (la
  página se sirve desde Pages). Si el dominio del API cambia, actualizar
  `connect-src` ahí.
- `frame-ancestors 'none'` no afecta al WebView (es navegación top-level, no
  un iframe).
- **localStorage** persiste entre reinicios de la app; borrar los datos de la
  app en Android = logout.
- El WebView del sistema se actualiza vía Play Store — sin trabajo nuestro.

## Esfuerzo estimado a v1

| Fase | Esfuerzo |
|---|---|
| 0 — Entorno | ~1 h (tuya, una vez) |
| 1 — Primer APK | 1 sesión |
| 2 — Pulido | 1-2 sesiones |
| 4 — Release | 0.5 sesión |
| **v1 completa** | **~3-4 sesiones** |
| 3 — Push FCM (opcional) | +2-3 sesiones |
