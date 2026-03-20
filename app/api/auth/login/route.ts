import { type NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

// Rate limiting en mémoire (OK pour un déploiement Docker avec processus persistant)
interface RateEntry {
  count: number;
  firstAttempt: number;
}
const attempts = new Map<string, RateEntry>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAttempt > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const entry = attempts.get(ip);
  if (!entry) {
    attempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    attempts.set(ip, { ...entry, count: entry.count + 1 });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives échouées. Réessayez dans 15 minutes." },
      { status: 429 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { username, password } = body;

  const validUsername = process.env.DASHBOARD_USERNAME ?? "admin";
  const validPassword = process.env.DASHBOARD_PASSWORD;

  if (!validPassword) {
    return NextResponse.json(
      { error: "Serveur non configuré — DASHBOARD_PASSWORD manquant dans .env." },
      { status: 500 }
    );
  }

  if (!username || !password || username !== validUsername || password !== validPassword) {
    recordFailure(ip);
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  // Connexion réussie — effacer les tentatives
  attempts.delete(ip);

  const token = await createSessionToken();
  const duration = parseInt(process.env.DASHBOARD_SESSION_DURATION ?? "86400");

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: duration,
    path: "/",
  });
  return response;
}
