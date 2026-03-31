// Service Worker — Homelab Dashboard v2
// Stratégie : Cache-First pour assets statiques, Network-First pour API

const CACHE_VERSION = "dashboard-cache-v2";
const STATIC_CACHE = "dashboard-static-v2";

// Assets à précacher à l'installation
const PRECACHE_ASSETS = ["/", "/manifest.json"];

// Patterns Network-First
const NETWORK_FIRST_PATTERNS = ["/api/", "/_next/data/"];

// Patterns à ne jamais cacher
const NEVER_CACHE = ["chrome-extension://", "hot-update", "sockjs-node"];

// ─── Installation ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_ASSETS).catch(() => {
          // Ignore precache failures (offline install)
        })
      )
      .then(() => self.skipWaiting())
  );
});

// ─── Activation — supprime tous les anciens caches ────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (NEVER_CACHE.some((p) => request.url.includes(p))) return;
  if (request.method !== "GET") return;

  // API : Network-First
  if (NETWORK_FIRST_PATTERNS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques : Cache-First
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ??
      new Response(JSON.stringify({ error: "Hors ligne" }), {
        headers: { "Content-Type": "application/json" },
        status: 503,
      })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Ressource non disponible hors ligne", { status: 503 });
  }
}
