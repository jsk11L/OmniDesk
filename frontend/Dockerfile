# OmniDesk frontend image (static Angular bundle served by nginx).
# IMPORTANT: build with the REPO ROOT as context (pnpm workspace; the frontend
# imports types from @omnidesk/shared, so ../shared must be available):
#   docker build -f frontend/Dockerfile -t omnidesk-frontend .
# docker-compose.yml already sets `context: .` for this reason.

# ── Builder ──────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json
RUN pnpm install --frozen-lockfile --filter frontend...

# Source. shared/ is needed for the @omnidesk/shared type imports.
COPY frontend frontend
COPY shared shared

# Public deploy-time config baked into the bundle.
ARG VAPID_PUBLIC_KEY=""
ARG CAPTCHA_SITE_KEY=""
ENV VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY
ENV CAPTCHA_SITE_KEY=$CAPTCHA_SITE_KEY
RUN node frontend/scripts/inject-env.js

# ng build defaults to the production configuration in Angular 18.
RUN pnpm --filter frontend run build

# ── Runner (nginx serving the SPA) ───────────────────────────
FROM nginx:alpine
# Angular's `application` builder emits browser assets under dist/frontend/browser.
COPY --from=builder /repo/frontend/dist/frontend/browser /usr/share/nginx/html
COPY infra/frontend-nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
