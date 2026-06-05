# OmniDesk backend image.
# IMPORTANT: build with the REPO ROOT as context (this is a pnpm workspace):
#   docker build -f backend/Dockerfile -t omnidesk-backend .
# docker-compose.yml already sets `context: .` for this reason.

# ── Builder ──────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo

# Workspace manifests first for better layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY shared/package.json shared/package.json

# Install only what the backend needs (it does not depend on shared/frontend).
RUN pnpm install --frozen-lockfile --filter backend...

# Build: generate Prisma client + compile TypeScript.
COPY backend backend
RUN pnpm --filter backend exec prisma generate \
 && pnpm --filter backend run build

# Produce a self-contained production bundle (prod deps only) in /app.
RUN pnpm --filter backend deploy --prod /app

# ── Runner ───────────────────────────────────────────────────
FROM node:22-alpine AS runner
# openssl: required by the Prisma query engine on alpine. wget: healthcheck.
RUN apk add --no-cache wget openssl
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./
RUN chmod +x ./scripts/entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["node", "dist/main"]
