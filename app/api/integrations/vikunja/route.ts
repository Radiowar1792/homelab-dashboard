import { NextResponse } from "next/server";

const VIKUNJA_URL = process.env["VIKUNJA_URL"] ?? "";
const VIKUNJA_TOKEN = process.env["VIKUNJA_TOKEN"] ?? "";

/**
 * GET /api/integrations/vikunja — Récupère les tâches et projets Vikunja
 */
export async function GET(request: Request) {
  if (!VIKUNJA_URL || !VIKUNJA_TOKEN) {
    return NextResponse.json({ error: "Vikunja non configuré" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "tasks";

  try {
    const headers = {
      Authorization: `Bearer ${VIKUNJA_TOKEN}`,
      "Content-Type": "application/json",
    };

    const endpoints: Record<string, string> = {
      tasks: `${VIKUNJA_URL}/api/v1/tasks/all`,
      projects: `${VIKUNJA_URL}/api/v1/projects`,
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
      { error: "Erreur Vikunja", details: String(error) },
      { status: 502 }
    );
  }
}
