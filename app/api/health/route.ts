import { NextResponse } from "next/server";

/**
 * GET /api/health — Healthcheck endpoint pour Docker et le load balancer
 * Vérifie que l'app répond (la DB est vérifiée séparément par docker-compose)
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env["npm_package_version"] ?? "unknown",
    },
    { status: 200 }
  );
}
