// public/sw.js — Vincollins PWA Service Worker v3

const CACHE_VERSION = 'v3'
const STATIC_CACHE = `vincollins-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `vincollins-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `vincollins-images-${CACHE_VERSION}`

// Assets that MUST be cached for offline use
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/offline.html',
]

// Routes that should ALWAYS go to network (auth, API, realtime)
const NETWORK_ONLY_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /\/_next\/webpack-hmr/,
  /\/auth\//,
]

// Routes that are fine to serve stale while revalidating
const STALE_WHILE_REVALIDATE_PATTERNS = [
  /\/_next\/static\//,
  /\/images\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\.(?:woff|woff2|ttf|eot)$/,
]

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_VERSION)
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Non-fatal — offline page might not exist yet
        console.warn('[SW] Failed to cache some static assets:', err)
      })
    })
  )
  // Activate immediately — don't wait for old SW to die
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_VERSION)
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              key.startsWith('vincollins-') &&
              ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key)
            )
            .map((key) => {
              console.log('[SW] Deleting old cache:', key)
              return caches.delete(key)
            })
        )
      ),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip network-only patterns (auth, supabase, API)
  if (NETWORK_ONLY_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return
  }

  // Skip chrome-extension and non-http
  if (!url.protocol.startsWith('http')) return

  // Images — cache first, long TTL
  if (STALE_WHILE_REVALIDATE_PATTERNS.some((p) => p.test(request.url))) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }

  // Navigation requests (HTML pages) — network first, fallback to offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Everything else — network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE))
})

// ── Strategies ────────────────────────────────────────────────────────────────

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)

  return cached || fetchPromise
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Try cache first
    const cached = await caches.match(request)
    if (cached) return cached

    // Try offline page
    const offline = await caches.match('/offline.html')
    if (offline) return offline

    // Last resort
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Offline — Vincollins</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center;
              justify-content: center; min-height: 100vh; margin: 0; background: #0A2472; color: white; }
            .box { text-align: center; padding: 2rem; }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { opacity: 0.8; margin-bottom: 2rem; }
            button { background: white; color: #0A2472; border: none; padding: 0.75rem 2rem;
              border-radius: 9999px; font-size: 1rem; font-weight: 600; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>📡 No Connection</h1>
            <p>Vincollins Portal needs internet to work.<br/>Please check your connection.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// ── Background Sync / Push (future) ──────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION })
  }
})