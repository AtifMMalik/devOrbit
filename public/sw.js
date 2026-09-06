const CACHE_NAME = 'devorbit-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-192x192.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Install Event: pre-cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Stale-while-revalidate with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests or chrome-extension schemes
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // Bypass service worker entirely for local development, Vite HMR, and dependencies
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.startsWith('/src/') ||
    url.search.includes('token=') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // For navigation requests (HTML document), try network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  // For static assets (scripts, styles, images, fonts): Cache-first with network update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch updated version in background to refresh cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          return new Response('', { status: 408, statusText: 'Request timed out or offline' });
        });
    })
  );
});

// Message Event: Allow client to force activation on manual reload
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

