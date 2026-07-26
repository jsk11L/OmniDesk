import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor wraps the Angular PWA in a native Android shell.
 *
 * REMOTE MODE: the WebView loads the deployed Cloudflare Pages site
 * (`server.url`), so every web deploy updates the app instantly and CORS stays
 * unchanged (origin = pages.dev). `webDir` still must exist for the CLI, but
 * those bundled assets are NOT used at runtime while `server.url` is set — a
 * placeholder is enough. See android/ROADMAP_ANDROID.md.
 */
const config: CapacitorConfig = {
  appId: 'app.omnidesk',
  appName: 'OmniDesk',
  webDir: 'frontend/dist/frontend/browser',
  server: {
    // The live web app — the same origin as FRONTEND_URL on Render.
    url: 'https://omnidesk-8no.pages.dev',
    cleartext: false,
  },
  android: {
    // The WebView reaches the API over HTTPS; no cleartext needed.
    allowMixedContent: false,
  },
};

export default config;
