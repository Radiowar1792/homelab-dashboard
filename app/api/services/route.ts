import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Schéma de validation pour un service à checker
const ServiceCheckSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  timeout: z.number().min(100).max(30000).optional().default(5000),
  expectedStatus: z.number().optional().default(200),
});

const ServicesCheckSchema = z.object({
  services: z.array(ServiceCheckSchema),
});

const ServiceCreateSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  category: z.string().optional(),
  expectedStatus: z.number().int().optional().default(200),
  timeout: z.number().int().min(100).max(30000).optional().default(5000),
  icon: z.string().optional(),
});

/**
 * GET /api/services — Retourne la liste des services configurés depuis la DB
 */
export async function GET() {
  try {
    const services = await prisma.serviceDefinition.findMany({
      orderBy: { position: "asc" },
    });
    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/services — Crée un nouveau service à monitorer
 */
export async function PUT(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = ServiceCreateSchema.parse(body);
    const count = await prisma.serviceDefinition.count();
    const service = await prisma.serviceDefinition.create({
      data: {
        name: data.name,
        url: data.url,
        expectedStatus: data.expectedStatus,
        timeout: data.timeout,
        position: count,
        ...(data.category !== undefined && { category: data.category }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
    });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/services — Check le statut d'une liste de services
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const { services } = ServicesCheckSchema.parse(body);

    const results = await Promise.allSettled(
      services.map(async (service) => {
        const startTime = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), service.timeout);

          const response = await fetch(service.url, {
            method: "GET",
            signal: controller.signal,
            // Désactiver la vérification SSL pour les services internes
            // En production avec des certificats auto-signés
          });

          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;

          return {
            id: service.id,
            name: service.name,
            url: service.url,
            status:
              response.status === service.expectedStatus
                ? "online"
                : "degraded",
            statusCode: response.status,
            responseTime,
            lastChecked: new Date(),
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            id: service.id,
            name: service.name,
            url: service.url,
            status: "offline" as const,
            responseTime,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : "Erreur inconnue",
          };
        }
      })
    );

    const checkResults = results.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );

    return NextResponse.json({ results: checkResults });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
