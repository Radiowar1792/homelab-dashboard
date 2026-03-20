# GitHub Secrets — Configuration requise

Ce fichier documente les secrets GitHub à configurer pour que le CI/CD fonctionne.
Ne jamais committer de vraies valeurs ici.

## Où configurer les secrets

**Repository secrets** : Settings → Secrets and variables → Actions → New repository secret

**Environment secrets** (pour `production`) : Settings → Environments → production → Add secret

---

## Secrets requis

### Environment `production` (déploiement uniquement)

| Secret | Description | Exemple |
|--------|-------------|---------|
| `SERVER_HOST` | IP ou domaine de ton serveur homelab | `192.168.1.100` ou `server.homelab.local` |
| `SERVER_USER` | Utilisateur SSH sur le serveur | `ubuntu` ou `batiste` |
| `SERVER_SSH_KEY` | Clé privée SSH complète (ed25519 recommandé) | Contenu de `~/.ssh/id_ed25519` |
| `APP_DOMAIN` | Domaine public de l'app (pour le health check) | `dashboard.tondomaine.com` |

### Repository secrets (partagés entre CI et Deploy)

| Secret | Description | Comment générer |
|--------|-------------|-----------------|
| `NEXTAUTH_SECRET` | Secret JWT NextAuth | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | Clé AES-256 pour les tokens en DB | `openssl rand -base64 32` |

---

## Variables d'environnement sur le serveur

Le fichier `~/homelab-dashboard/.env` sur ton serveur doit contenir :

```bash
# Généré automatiquement ou copié depuis .env.example
DATABASE_URL="postgresql://homelab:TON_MOT_DE_PASSE@postgres:5432/homelab_dashboard"
REDIS_URL="redis://redis:6379"

NEXTAUTH_URL="https://dashboard.tondomaine.com"
NEXTAUTH_SECRET="même valeur que le secret GitHub NEXTAUTH_SECRET"

ADMIN_EMAIL="ton@email.com"
ADMIN_PASSWORD_HASH=""  # Généré au premier seed

ENCRYPTION_KEY="même valeur que le secret GitHub ENCRYPTION_KEY"

POSTGRES_DB="homelab_dashboard"
POSTGRES_USER="homelab"
POSTGRES_PASSWORD="mot-de-passe-fort-postgres"

APP_PORT=3000
NEXT_PUBLIC_APP_URL="https://dashboard.tondomaine.com"

# Intégrations (optionnel, configurable aussi via l'UI)
HOME_ASSISTANT_URL=""
OLLAMA_URL="http://host.docker.internal:11434"
```

---

## Setup initial du serveur

```bash
# 1. Se connecter au serveur
ssh user@server

# 2. Créer le dossier de déploiement
mkdir -p ~/homelab-dashboard

# 3. Créer le fichier .env (avec les valeurs ci-dessus)
nano ~/homelab-dashboard/.env

# 4. Login au registry GitHub Container Registry
echo TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 5. Premier déploiement manuel (ensuite automatique via CI/CD)
cd ~/homelab-dashboard
docker compose pull
docker compose up -d

# 6. Migrations et seed initial
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm prisma db seed
```

---

## Générer la clé SSH pour le déploiement

```bash
# Sur ta machine locale
ssh-keygen -t ed25519 -C "github-deploy@homelab-dashboard" -f ~/.ssh/github_deploy

# Ajouter la clé publique sur le serveur
ssh-copy-id -i ~/.ssh/github_deploy.pub user@server

# Copier la clé privée dans le secret GitHub SERVER_SSH_KEY
cat ~/.ssh/github_deploy
```
