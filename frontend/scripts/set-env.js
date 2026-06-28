/*
 * Build-time environment injection for static hosts (Cloudflare Pages, Vercel…).
 *
 * Angular bakes `environment.production.ts` into the bundle, so the API URL must
 * be known at build time. This script rewrites that file from environment vars
 * set in the host's build settings. When API_URL is not set (e.g. local builds)
 * it leaves the committed file untouched.
 *
 * Cloudflare Pages build command:
 *   node frontend/scripts/set-env.js && pnpm --filter frontend build
 *
 * Recognised vars: API_URL (required), CAPTCHA_SITE_KEY, VAPID_PUBLIC_KEY.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'src', 'environments', 'environment.production.ts');

const apiUrl = process.env.API_URL;
if (!apiUrl) {
  console.warn('[set-env] API_URL not set — keeping the committed environment.production.ts');
  process.exit(0);
}

// Drop a trailing slash so `${apiUrl}/auth/login` never doubles up.
const cleanApi = apiUrl.replace(/\/+$/, '');
const captcha = process.env.CAPTCHA_SITE_KEY ?? '';
const vapid = process.env.VAPID_PUBLIC_KEY ?? '';

const contents = `export const environment = {
  production: true,
  apiUrl: '${cleanApi}',
  vapidPublicKey: '${vapid}',
  captchaSiteKey: '${captcha}',
};
`;

fs.writeFileSync(target, contents);
console.log(`[set-env] wrote environment.production.ts → apiUrl=${cleanApi}`);
