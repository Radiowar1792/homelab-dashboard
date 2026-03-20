/**
 * Session utilities — compatibles Edge runtime (Web Crypto API)
 * Utilisées par middleware.ts et les routes d'auth.
 */

export const SESSION_COOKIE = "homelab-session";

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET ?? "homelab-dev-secret-change-in-production";
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

/** Crée un token de session signé avec HMAC-SHA256. */
export async function createSessionToken(): Promise<string> {
  const payload = `session:${Date.now()}`;
  const key = await getKey("sign");
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  // Format: base64(payload + "." + hexSig) — uniquement des chars ASCII
  return btoa(`${payload}.${toHex(sig)}`);
}

/** Vérifie la signature et l'expiration d'un token. */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const decoded = atob(token);
    const dotIdx = decoded.lastIndexOf(".");
    if (dotIdx === -1) return false;

    const payload = decoded.slice(0, dotIdx);
    const sigHex = decoded.slice(dotIdx + 1);

    // Vérifier la signature
    const pairs = sigHex.match(/.{2}/g);
    if (!pairs) return false;
    const sigBytes = new Uint8Array(pairs.map((b) => parseInt(b, 16)));
    const key = await getKey("verify");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(payload)
    );
    if (!valid) return false;

    // Vérifier l'expiration
    const parts = payload.split(":");
    const ts = parseInt(parts[1] ?? "0");
    if (isNaN(ts)) return false;
    const durationMs =
      parseInt(process.env.DASHBOARD_SESSION_DURATION ?? "86400") * 1000;
    return Date.now() - ts < durationMs;
  } catch {
    return false;
  }
}
