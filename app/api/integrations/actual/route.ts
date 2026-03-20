import { NextResponse } from "next/server";

const ACTUAL_URL = process.env["ACTUAL_URL"] ?? "";

/**
 * GET /api/integrations/actual — Récupère les données Actual Budget
 * Note: Actual Budget a une API locale — adapter selon la configuration
 */
export async function GET() {
  if (!ACTUAL_URL) {
    return NextResponse.json({ error: "Actual Budget non configuré" }, { status: 503 });
  }

  try {
    // TODO: Implémenter avec @actual-app/api (bibliothèque officielle)
    // L'API Actual Budget est locale et nécessite une synchronisation
    return NextResponse.json({
      message: "Intégration Actual Budget — à implémenter",
      accounts: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur Actual Budget", details: String(error) },
      { status: 502 }
    );
  }
}
