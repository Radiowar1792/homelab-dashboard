import { NextResponse } from "next/server";
import { z } from "zod";

const HARequestSchema = z.object({
  action: z.enum(["states", "call-service"]),
  entityId: z.string().optional(),
  domain: z.string().optional(),
  service: z.string().optional(),
  serviceData: z.record(z.unknown()).optional(),
});

const HA_URL = process.env["HOME_ASSISTANT_URL"] ?? "";
const HA_TOKEN = process.env["HOME_ASSISTANT_TOKEN"] ?? "";

/**
 * POST /api/integrations/homeassistant — Proxy vers Home Assistant REST API
 */
export async function POST(request: Request) {
  if (!HA_URL || !HA_TOKEN) {
    return NextResponse.json(
      { error: "Home Assistant non configuré" },
      { status: 503 }
    );
  }

  try {
    const body: unknown = await request.json();
    const { action, entityId, domain, service, serviceData } =
      HARequestSchema.parse(body);

    const headers = {
      Authorization: `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
    };

    if (action === "states") {
      const endpoint = entityId
        ? `${HA_URL}/api/states/${entityId}`
        : `${HA_URL}/api/states`;

      const response = await fetch(endpoint, { headers });
      const data: unknown = await response.json();
      return NextResponse.json(data);
    }

    if (action === "call-service" && domain && service) {
      const response = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
        method: "POST",
        headers,
        body: JSON.stringify(serviceData ?? {}),
      });
      const data: unknown = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Requête invalide", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erreur Home Assistant", details: String(error) },
      { status: 502 }
    );
  }
}
