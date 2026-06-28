export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  vapidPublicKey: 'BIboVxoNe_m30dLOtn-ILS9Gb6w_NTiV5wdnsjZUCZxUsLIcgIWQ_qwYFFmVzYbPA2UjnJ2d6LNvKUjfAFRMYUA',
  // Cloudflare Turnstile site key. Empty = captcha widget hidden (matches
  // backend CAPTCHA_PROVIDER=none for local dev).
  captchaSiteKey: '',
};
