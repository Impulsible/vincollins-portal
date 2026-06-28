// public/sw.js — Vincollins PWA Service Worker v3

const CACHE_VERSION = 'v3'
const STATIC_CACHE  = `vincollins-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `vincollins-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE   = `vincollins-images-${CACHE_VERSION}`

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

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version', CACHE_VERSION)
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some static assets:', err)
      })
    )
  )
  self.skipWaiting()
})

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version', CACHE_VERSION)
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith('vincollins-') &&
                ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key)
            )
            .map((key) => {
              console.log('[SW] Deleting old cache:', key)
              return caches.delete(key)
            })
        )
      ),
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

  // Skip chrome-extension and non-http(s)
  if (!url.protocol.startsWith('http')) return

  // ── CRITICAL: Never intercept the PWA start_url launch ───────────────────
  // /?launch=app is set by manifest start_url.
  // If the SW serves a cached response here (e.g. a cached /portal page),
  // the splash screen never sees a fresh "/" and routes to the wrong place.
  // Always go to network so TwoStageSplashScreen's decision logic runs fresh.
  if (url.pathname === '/' && url.searchParams.get('launch') === 'app') {
    console.log('[SW] start_url launch detected — bypassing cache')
    event.respondWith(
      fetch(request).catch(() =>
        // If genuinely offline, serve cached "/" without the param
        caches.match('/').then(
          (cached) =>
            cached ??
            new Response('Offline', {
              status:  503,
              headers: { 'Content-Type': 'text/plain' },
            })
        )
      )
    )
    return
  }

  // Skip network-only patterns (auth, supabase, API, HMR)
  if (NETWORK_ONLY_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return
  }

  // Images / static assets — stale-while-revalidate
  if (STALE_WHILE_REVALIDATE_PATTERNS.some((p) => p.test(request.url))) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE))
    return
  }

  // HTML navigation — network first, offline fallback
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
    return cached ?? new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)

  return cached ?? fetchPromise
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
    // 1. Try cached version of this exact page
    const cached = await caches.match(request)
    if (cached) return cached

    // 2. Try pre-cached offline page
    const offline = await caches.match('/offline.html')
    if (offline) return offline

    // 3. Inline fallback
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Offline — Vincollins</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: system-ui, -apple-system, sans-serif;
        display: flex; align-items: center; justify-content: center;
        min-height: 100vh; background: #060D1F; color: white;
      }
      .box { text-align: center; padding: 2rem; max-width: 360px; }
      .icon { font-size: 3rem; margin-bottom: 1.5rem; }
      h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; }
      p  { opacity: 0.7; line-height: 1.6; margin-bottom: 2rem; font-size: 0.9rem; }
      button {
        background: white; color: #0A2472; border: none;
        padding: 0.75rem 2rem; border-radius: 9999px;
        font-size: 1rem; font-weight: 600; cursor: pointer;
        transition: opacity 0.2s;
      }
      button:hover { opacity: 0.9; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="icon">📡</div>
      <h1>No Connection</h1>
      <p>
        Vincollins Portal needs an internet connection.<br />
        Please check your network and try again.
      </p>
      <button onclick="window.location.reload()">Try Again</button>
    </div>
  </body>
</html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

// ── Messages ──────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting — updating now')
    self.skipWaiting()
  }

  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION })
  }
})