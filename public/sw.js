// Service Worker — Homelab Dashboard
// Stratégie : Cache-First pour assets statiques, Network-First pour API

const CACHE_NAME = "homelab-dashboard-v1";
const STATIC_CACHE_NAME = "homelab-static-v1";

// Assets à mettre en cache immédiatement à l'installation
const PRECACHE_ASSETS = ["/", "/manifest.json", "/offline.html"];

// Patterns d'URL qui suivent la stratégie Network-First (API calls)
const NETWORK_FIRST_PATTERNS = ["/api/", "/_next/data/"];

// Patterns d'URL à ne jamais mettre en cache
const NEVER_CACHE_PATTERNS = ["chrome-extension://", "hot-update"];

// ─── Installation : précache les assets critiques ───
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activation : nettoie les anciens caches ───
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch : intercepte les requêtes ───
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les patterns non-cachables
  if (NEVER_CACHE_PATTERNS.some((pattern) => request.url.includes(pattern))) {
    return;
  }

  // Seulement intercepter les requêtes GET
  if (request.method !== "GET") return;

  // API calls : Network-First (données fraîches > cache)
  if (NETWORK_FIRST_PATTERNS.some((pattern) => url.pathname.startsWith(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques : Cache-First (performance)
  event.respondWith(cacheFirst(request));
});

// Stratégie Network-First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // Mettre en cache si succès
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Fallback sur le cache si réseau indisponible
    const cached = await caches.match(request);
    return cached ?? new Response(JSON.stringify({ error: "Hors ligne" }), {
      headers: { "Content-Type": "application/json" },
      status: 503,
    });
  }
}

// Stratégie Cache-First
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Ressource non disponible hors ligne", { status: 503 });
  }
}
