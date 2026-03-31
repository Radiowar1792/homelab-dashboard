/**
 * Utilitaires client pour lire/écrire les settings via l'API.
 * Les écritures sont debounced à 300 ms par clé pour ne pas spammer l'API.
 */

const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();

/** Sauvegarde debounced (300 ms par défaut) d'une clé. */
export function saveSetting(key: string, value: string, ms = 300): void {
  const existing = pendingWrites.get(key);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingWrites.delete(key);
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch((err) => {
      console.warn("[settings] save failed:", key, err);
    });
  }, ms);

  pendingWrites.set(key, timer);
}

/** Flush immédiat (sans debounce). Utile avant unmount. */
export function flushSetting(key: string, value: string): Promise<void> {
  const existing = pendingWrites.get(key);
  if (existing) { clearTimeout(existing); pendingWrites.delete(key); }
  return fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  })
    .then(() => undefined)
    .catch((err) => { console.warn("[settings] flush failed:", key, err); });
}

/** Parse JSON de façon silencieuse. */
export function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
