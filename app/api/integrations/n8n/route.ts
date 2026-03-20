import { NextResponse } from "next/server";

const N8N_URL = process.env["N8N_URL"] ?? "";
const N8N_API_KEY = process.env["N8N_API_KEY"] ?? "";

/**
 * GET /api/integrations/n8n — Récupère les workflows et exécutions N8N
 */
export async function GET(request: Request) {
  if (!N8N_URL || !N8N_API_KEY) {
    return NextResponse.json({ error: "N8N non configuré" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "workflows";

  try {
    const headers = {
      "X-N8N-API-KEY": N8N_API_KEY,
      "Content-Type": "application/json",
    };

    const endpoints: Record<string, string> = {
      workflows: `${N8N_URL}/api/v1/workflows`,
      executions: `${N8N_URL}/api/v1/executions?limit=20`,
    };

    const endpoint = endpoints[resource];
    if (!endpoint) {
      return NextResponse.json({ error: "Ressource invalide" }, { status: 400 });
    }

    const response = await fetch(endpoint, { headers });
    const data: unknown = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur N8N", details: String(error) },
      { status: 502 }
    );
  }
}
