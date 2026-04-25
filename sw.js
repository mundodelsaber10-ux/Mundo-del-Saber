// ============================================================
// sw.js — Service Worker
// Estrategia: Cache-first para assets, Network-first para datos
// ============================================================

const CACHE_VERSION = 'mimundo-v1';
const CACHE_STATIC  = 'mimundo-static-v1';
const CACHE_DYNAMIC = 'mimundo-dynamic-v1';

// Assets que se cachean inmediatamente al instalar
const ASSETS_ESTATICOS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/entrada.css',
  '/css/login-nino.css',
  '/css/login-adulto.css',
  '/js/utils.js',
  '/pages/login-nino.html',
  '/pages/login-adulto.html',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;800&family=Nunito:wght@400;600;700&display=swap',
];

// ── INSTALL: cachear assets estáticos ─────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(ASSETS_ESTATICOS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar caches viejos ───────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia por tipo de recurso ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones a Supabase (siempre necesitan red)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetchConFallback(request));
    return;
  }

  // Ignorar peticiones POST/PUT/DELETE
  if (request.method !== 'GET') return;

  // Fuentes de Google: cache-first
  if (url.hostname.includes('fonts.')) {
    event.respondWith(cachePrimero(request, CACHE_STATIC));
    return;
  }

  // CDN de Supabase JS y otros scripts externos: cache-first
  if (url.hostname.includes('cdn.jsdelivr.net') || url.hostname.includes('unpkg.com')) {
    event.respondWith(cachePrimero(request, CACHE_DYNAMIC));
    return;
  }

  // Assets propios: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ── ESTRATEGIAS ────────────────────────────────────────────

async function cachePrimero(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Sin conexión', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache  = await caches.open(CACHE_STATIC);
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);

  return cached ?? fetchPromise;
}

async function fetchConFallback(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Sin conexión', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
