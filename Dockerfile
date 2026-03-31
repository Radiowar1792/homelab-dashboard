# ═══════════════════════════════════════════════════════════════
# Dockerfile multi-stage — Homelab Dashboard
# Stage 1 (deps)    : Installation des dépendances
# Stage 2 (builder) : Build Next.js
# Stage 3 (runner)  : Image minimale production
# ═══════════════════════════════════════════════════════════════

# ── Stage 1 : Dépendances ────────────────────────────────────
FROM node:20-alpine AS deps

# openssl requis par Prisma ; python3/make/g++ pour better-sqlite3 (native module)
RUN apk add --no-cache openssl python3 make g++

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copier uniquement les fichiers nécessaires à l'installation
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Installer toutes les dépendances (devDeps incluses pour le build + seed)
RUN pnpm install --frozen-lockfile

# ── Stage 2 : Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl python3 make g++
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Récupérer les node_modules du stage précédent
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copier le code source
COPY . .

# Variables d'env nécessaires au build (valeurs placeholder)
# Les vraies valeurs sont injectées au runtime via docker-compose
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="build-time-placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV ENCRYPTION_KEY="build-time-placeholder-32-bytes!!"

# Générer le client Prisma (binaire pour l'architecture cible)
RUN pnpm prisma generate

# Build Next.js
RUN pnpm build

# ── Stage 3 : Runner (image production minimale) ─────────────
FROM node:20-alpine AS runner

# openssl requis par Prisma au runtime pour les requêtes DB
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Sécurité : utilisateur non-root
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copier avec la bonne ownership pour que nextjs puisse écrire
# (Prisma écrit son engine binary dans node_modules au premier démarrage)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Script de démarrage (migrations + seed + app)
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Passer à l'utilisateur non-root
USER nextjs

# Dossier pour la base SQLite settings (monté en volume Docker)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/dashboard.db

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["./docker-entrypoint.sh"]
