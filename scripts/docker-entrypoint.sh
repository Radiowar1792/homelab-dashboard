#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# docker-entrypoint.sh — Script de démarrage du container
# 1. Attend que PostgreSQL soit disponible
# 2. Exécute les migrations Prisma
# 3. Lance l'application Next.js
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 Démarrage du Homelab Dashboard..."

# ── Attendre PostgreSQL ───────────────────────────────────────
echo "⏳ Attente de PostgreSQL..."
max_attempts=30
attempt=0

until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => { client.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "❌ PostgreSQL inaccessible après ${max_attempts} tentatives"
    exit 1
  fi
  echo "   Tentative ${attempt}/${max_attempts}..."
  sleep 2
done

echo "✅ PostgreSQL prêt"

# ── Migrations Prisma ─────────────────────────────────────────
echo "📦 Application des migrations Prisma..."
node_modules/.bin/prisma migrate deploy

echo "✅ Migrations appliquées"

# ── Démarrer Next.js ─────────────────────────────────────────
echo "🌐 Démarrage de Next.js..."
exec node_modules/.bin/next start
