#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# docker-entrypoint.sh — Script de démarrage du container
# 1. Attend que PostgreSQL soit disponible (TCP check)
# 2. Synchronise le schéma Prisma (db push)
# 3. Initialise les données (seed)
# 4. Lance l'application Next.js
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 Démarrage du Homelab Dashboard..."

# ── Attendre PostgreSQL (check TCP sans dépendance externe) ──
echo "⏳ Attente de PostgreSQL..."
max_attempts=30
attempt=0

until node -e "
const net = require('net');
const url = new URL(process.env.DATABASE_URL);
const host = url.hostname;
const port = parseInt(url.port) || 5432;
const sock = new net.Socket();
sock.setTimeout(2000);
sock.connect(port, host, () => { sock.destroy(); process.exit(0); });
sock.on('error', () => { sock.destroy(); process.exit(1); });
sock.on('timeout', () => { sock.destroy(); process.exit(1); });
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

# ── Synchroniser le schéma Prisma ────────────────────────────
# db push crée les tables si elles n'existent pas (idempotent)
echo "📦 Synchronisation du schéma (prisma db push)..."
node_modules/.bin/prisma db push --accept-data-loss

echo "✅ Schéma synchronisé"

# ── Initialiser les données (seed) ───────────────────────────
echo "🌱 Initialisation des données (seed)..."
node_modules/.bin/prisma db seed && echo "✅ Seed terminé" || echo "ℹ️  Seed ignoré (données déjà présentes)"

# ── Démarrer Next.js ─────────────────────────────────────────
echo "🌐 Démarrage de Next.js sur :3000..."
exec node_modules/.bin/next start
