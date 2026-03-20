/**
 * Seed Prisma — Données initiales pour le dashboard
 * Exécuter avec : pnpm prisma db seed
 *
 * Crée :
 * - L'utilisateur admin (depuis les variables d'env)
 * - Les intégrations par défaut (désactivées)
 * - Les widgets par défaut
 * - Quelques services à monitorer en exemple
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.warn("🌱 Démarrage du seed...");

  // ─── Utilisateur admin ────────────────────────────────────────
  const adminEmail = process.env["ADMIN_EMAIL"] ?? "admin@homelab.local";
  const adminPassword = process.env["ADMIN_INITIAL_PASSWORD"] ?? "changeme123!";

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Admin",
        role: "ADMIN",
      },
    });
    console.warn(`✅ Utilisateur admin créé : ${adminEmail}`);
    console.warn(`   Mot de passe initial : ${adminPassword}`);
    console.warn(`   ⚠️  Changez le mot de passe dès la première connexion !`);
  } else {
    console.warn(`ℹ️  Utilisateur admin déjà existant : ${adminEmail}`);
  }

  // ─── Intégrations par défaut ─────────────────────────────────
  const integrations = [
    {
      name: "homeassistant",
      displayName: "Home Assistant",
      baseUrl: process.env["HOME_ASSISTANT_URL"] ?? "",
    },
    {
      name: "vikunja",
      displayName: "Vikunja",
      baseUrl: process.env["VIKUNJA_URL"] ?? "",
    },
    {
      name: "n8n",
      displayName: "N8N",
      baseUrl: process.env["N8N_URL"] ?? "",
    },
    {
      name: "docmost",
      displayName: "Docmost",
      baseUrl: process.env["DOCMOST_URL"] ?? "",
    },
    {
      name: "actual",
      displayName: "Actual Budget",
      baseUrl: process.env["ACTUAL_URL"] ?? "",
    },
    {
      name: "ollama",
      displayName: "Ollama (LLM)",
      baseUrl: process.env["OLLAMA_URL"] ?? "http://localhost:11434",
      isEnabled: true, // Ollama activé par défaut (local)
    },
  ];

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { name: integration.name },
      update: {},
      create: {
        name: integration.name,
        displayName: integration.displayName,
        baseUrl: integration.baseUrl,
        isEnabled: integration.isEnabled ?? false,
      },
    });
  }
  console.warn("✅ Intégrations créées");

  // ─── Services à monitorer en exemple ──────────────────────────
  const services = [
    {
      name: "Homelab Dashboard",
      url: process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
      category: "App",
      position: 0,
    },
  ];

  for (const service of services) {
    await prisma.serviceDefinition.upsert({
      where: { id: `seed-${service.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-${service.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...service,
      },
    });
  }
  console.warn("✅ Services exemples créés");

  // ─── Widgets par défaut ───────────────────────────────────────
  const defaultWidgets = [
    { type: "service-status", position: 0, size: "MEDIUM" as const, config: {} },
    { type: "rss-feed", position: 1, size: "MEDIUM" as const, config: { limit: 5 } },
    { type: "llm-chat", position: 2, size: "LARGE" as const, config: { model: "llama3.2" } },
  ];

  const existingWidgets = await prisma.widgetConfig.count();
  if (existingWidgets === 0) {
    await prisma.widgetConfig.createMany({ data: defaultWidgets });
    console.warn("✅ Widgets par défaut créés");
  } else {
    console.warn("ℹ️  Widgets déjà existants, skip");
  }

  console.warn("🎉 Seed terminé !");
}

main()
  .catch((error) => {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
