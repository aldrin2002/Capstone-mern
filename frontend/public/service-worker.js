// Less aggressive caching strategy to avoid stale/unstyled refreshes
const VERSION = '2025-11-22-2';
const STATIC_CACHE = `cafex-static-${VERSION}`;
const RUNTIME_CACHE = `cafex-runtime-${VERSION}`;

// Only precache absolutely stable assets (do NOT precache index.html or root)
const PRECACHE_URLS = [
  '/manifest.json',
  '/cafex-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => {
          if (![STATIC_CACHE, RUNTIME_CACHE].includes(k) && k.startsWith('cafex-')) {
            return caches.delete(k);
          }
        })
      );
      await self.clients.claim();
      // Notify pages that a new version is active
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach(client => client.postMessage({ type: 'SW_ACTIVE', version: VERSION }));
    })()
  );
});

// Helper: network-first for navigations to always get latest HTML
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch (err) {
    // Minimal offline response (no offline.html)
    return new Response('<!doctype html><title>Offline</title><h1>Offline</h1><p>Connection lost. Retry when online.</p>', {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }
    });
  }
}

// Cache-first for images & fonts only; let browser manage JS/CSS via normal HTTP caching
function shouldStaticCache(url) {
  return /\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // ignore non-GET
  const url = new URL(request.url);

  // Skip API caching entirely
  if (url.pathname.startsWith('/api/')) return; // let network handle

  // Navigations (HTML pages) - network first
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Static assets (images/fonts)
  if (shouldStaticCache(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => 
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }
  // For everything else (JS/CSS), just use network; fallback to cache if exists
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/cafex-logo.png',
    badge: '/cafex-logo.png',
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Open URL when notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  );
});