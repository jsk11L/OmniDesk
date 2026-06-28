# Deploy: Cloudflare Pages + Render + Neon (free tier)

A split, zero-cost deployment:

```
   Browser
      │
      ▼
Cloudflare Pages  ──HTTPS──►  Render (Docker)  ──TLS──►  Neon
 (Angular static)   CORS       NestJS API                Postgres
```

- **Frontend** → Cloudflare Pages (static Angular build, global CDN).
- **Backend** → Render web service, built from `backend/Dockerfile`.
- **Database** → Neon serverless Postgres.

Everything needed is already in the repo: `render.yaml` (Render Blueprint),
`frontend/scripts/set-env.js` (bakes the API URL at build time) and
`frontend/src/_redirects` (SPA fallback). You only create the accounts and paste
a few values.

> **Order matters** because the two sides reference each other's URL. We deploy
> the **DB → backend → frontend**, then come back and lock CORS.

---

## 1. Neon — Postgres

1. Create a project at <https://neon.tech> (free tier).
2. In the project, open **Connection Details**. Pick the **direct** connection
   string (not the `-pooler` one — Prisma migrations need a direct connection)
   and make sure `?sslmode=require` is present. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxx-123.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Keep that string handy — it's the `DATABASE_URL` for Render.

You don't need to create tables: the backend container runs
`prisma migrate deploy` + the idempotent seed on every boot (see
`backend/scripts/entrypoint.sh`).

---

## 2. Render — backend API

1. Push this repo to GitHub if you haven't.
2. Render dashboard → **New +** → **Blueprint** → connect the repo. Render reads
   `render.yaml` and proposes the `omnidesk-api` web service (Docker, free plan).
3. Before the first deploy, set the two `sync: false` secrets:
   - `DATABASE_URL` → the Neon string from step 1.
   - `FRONTEND_URL` → put a placeholder for now, e.g. `https://omnidesk.pages.dev`
     (we'll fix it in step 4 once Cloudflare gives the real URL).
   - `JWT_SECRET` / `JWT_REFRESH_SECRET` are **auto-generated** by Render — leave them.
4. **Create**. The first build takes a few minutes (Docker). When live, note the
   service URL, e.g. `https://omnidesk-api.onrender.com`.
5. Sanity check: open `https://omnidesk-api.onrender.com/health` → `{"status":"ok",…}`.

> **Free-plan caveats**
> - The service **sleeps after ~15 min idle**; the next request cold-starts in
>   ~50 s (it also re-runs migrations — idempotent, just slow).
> - The filesystem is **ephemeral**: uploaded images are wiped on every restart.
>   For persistent uploads add a paid **Disk** mounted at `/app/uploads`, or move
>   uploads to external storage (Cloudflare R2 / S3) — a future code change.

---

## 3. Cloudflare Pages — frontend

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick the repo.
2. Build settings:
   - **Framework preset:** None.
   - **Root directory:** *(leave as repo root)*.
   - **Build command** (Cloudflare runs `pnpm install` for you first, so only build):
     ```
     pnpm --filter frontend build:cloud
     ```
   - **Build output directory:**
     ```
     frontend/dist/frontend/browser
     ```
3. **Environment variables** (Production):
   - `API_URL` → the Render URL from step 2, e.g. `https://omnidesk-api.onrender.com`
   - `NODE_VERSION` → `22`
   - *(optional)* `CAPTCHA_SITE_KEY`, `VAPID_PUBLIC_KEY` if you enable those.
4. **Save and Deploy**. When done, note the Pages URL, e.g.
   `https://omnidesk.pages.dev`.

`build:cloud` runs `set-env.js` first, which rewrites `environment.production.ts`
with your `API_URL` before `ng build`.

---

## 4. Lock CORS (close the loop)

The backend only accepts requests whose `Origin` exactly equals `FRONTEND_URL`.

1. Render → `omnidesk-api` → **Environment** → set `FRONTEND_URL` to the **exact**
   Cloudflare URL from step 3 (no trailing slash), e.g. `https://omnidesk.pages.dev`.
2. Save → Render redeploys.
3. Open the Pages URL, register the **first account** (it becomes the **admin**),
   and verify login works (network tab: requests hit the Render URL, no CORS error).

---

## 5. After it's live

- **First user is admin** — register yours first, then optionally set
  `REGISTRATION_OPEN=false` on Render to lock signups.
- **Captcha** is off (`CAPTCHA_PROVIDER=none`). To enable Cloudflare Turnstile,
  set `CAPTCHA_PROVIDER=turnstile` + `CAPTCHA_SECRET` on Render and
  `CAPTCHA_SITE_KEY` on Cloudflare, then redeploy both.
- **Push notifications** need a VAPID keypair (`npx web-push generate-vapid-keys`):
  `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` on Render, and the
  same public key as `VAPID_PUBLIC_KEY` on Cloudflare.

### Custom domain (optional)
Point a domain at Cloudflare Pages (Custom domains tab). Then update Render's
`FRONTEND_URL` to that domain and redeploy so CORS keeps matching.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Login fails, console shows **CORS** error | `FRONTEND_URL` on Render ≠ the exact Pages origin (scheme + host, no trailing slash). Fix and redeploy. |
| All API calls 404 / go to the wrong host | `API_URL` wasn't set at build → rebuild Pages with the env var; confirm the build log shows `[set-env] wrote … apiUrl=…`. |
| Deep links 404 on refresh | `_redirects` missing from the output — confirm `frontend/src/_redirects` exists and the asset is copied. |
| First request hangs ~50 s | Render free cold start. Expected; upgrade the plan to keep it warm. |
| Boot fails on `prisma migrate deploy` | `DATABASE_URL` wrong or using the pooled endpoint — use Neon's **direct** string with `sslmode=require`. |
| Uploaded images disappear | Render free ephemeral disk — add a paid Disk at `/app/uploads` or external storage. |
