# ═══════════════════════════════════════════════════════════════
# Dockerfile multi-stage — Homelab Dashboard
# Stage 1 (deps)    : Installation des dépendances
# Stage 2 (builder) : Build Next.js
# Stage 3 (runner)  : Image minimale production
# ═══════════════════════════════════════════════════════════════

# ── Stage 1 : Dépendances ────────────────────────────────────
FROM node:20-alpine AS deps

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copier uniquement les fichiers nécessaires à l'installation
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Installer les dépendances (incluant devDeps pour le build)
RUN pnpm install --frozen-lockfile

# ── Stage 2 : Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Récupérer les node_modules du stage précédent
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copier le code source
COPY . .

# Variables d'env nécessaires au build (valeurs placeholder)
# Les vraies valeurs sont injectées au runtime
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="build-time-placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV ENCRYPTION_KEY="build-time-placeholder-32-bytes!!"

# Générer le client Prisma
RUN pnpm prisma generate

# Build Next.js
RUN pnpm build

# ── Stage 3 : Runner (image production minimale) ─────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Sécurité : utilisateur non-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copier uniquement ce qui est nécessaire pour faire tourner l'app
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copier le build Next.js (standalone ou standard)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Script de démarrage (migrations + app)
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Passer à l'utilisateur non-root
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck intégré
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
