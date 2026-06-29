import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the built Angular PWA into a native Android shell.
 * `webDir` points at the production browser build (see README in android/).
 * The bundled web app talks to the deployed API, so build it with the right
 * API_URL baked in: `API_URL=https://<your-api>.onrender.com pnpm android:sync`.
 */
const config: CapacitorConfig = {
  appId: 'app.omnidesk',
  appName: 'OmniDesk',
  webDir: 'frontend/dist/frontend/browser',
  android: {
    // The WebView reaches the API over HTTPS; no cleartext needed in prod.
    allowMixedContent: false,
  },
};

export default config;
