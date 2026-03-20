import { NextResponse } from "next/server";

const DOCMOST_URL = process.env["DOCMOST_URL"] ?? "";

/**
 * GET /api/integrations/docmost — Récupère les pages récentes Docmost
 * Note: Docmost utilise une API REST — adapter selon la version installée
 */
export async function GET() {
  if (!DOCMOST_URL) {
    return NextResponse.json({ error: "Docmost non configuré" }, { status: 503 });
  }

  try {
    // TODO: Adapter selon l'API Docmost disponible
    const response = await fetch(`${DOCMOST_URL}/api/pages?limit=10`, {
      headers: { "Content-Type": "application/json" },
    });
    const data: unknown = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur Docmost", details: String(error) },
      { status: 502 }
    );
  }
}
