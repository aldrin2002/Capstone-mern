// Increment this version whenever you deploy new frontend code
const CACHE_VERSION = 'v2';
const CACHE_NAME = `cafex-${CACHE_VERSION}`;

// Core assets that should be cached on install (keep minimal)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/cafex-logo.png'
];

// Helper: send a message to all controlled clients
function broadcastMessage(msg) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => client.postMessage(msg));
  });
}

// Install: pre-cache only CORE assets and activate immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches and claim clients
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key.startsWith('cafex-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
      broadcastMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
    })()
  );
});

// Strategy helpers
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cacheMatch = await caches.match(request);
    if (cacheMatch) return cacheMatch;
    // Fallback to core index.html for navigations
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  return cached || networkPromise || fetch(request);
}

// Fetch handler
self.addEventListener('fetch', event => {
  // Ignore non-GET and browser extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);

  // Do not cache API calls; always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).catch(() => new Response(JSON.stringify({ error: 'Network unavailable' }), { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Navigation requests (HTML pages) -> network-first to get latest
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Static assets (.js, .css, images, etc.) -> stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request));
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