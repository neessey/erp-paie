const CACHE_NAME = 'erp-paie-cache-v1';
const OFFLINE_URL = '/index.html';

// Pre-cache core shell resources on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell');
      return cache.addAll([
        '/',
        '/index.html',
        '/icon.jpg',
        '/manifest.json'
      ]).catch((err) => {
        console.error('[Service Worker] Pre-caching failed during installation:', err);
      });
    })
  );
  // Force active state immediately
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim active clients immediately
  self.clients.claim();
});

// Handle requests with a Network-First (with cache fallback) strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Firebase, Firestore, and Hot Module Replacement WebSocket requests
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.port === '3001' ||
    event.request.url.includes('/ws')
  ) {
    return;
  }

  // Network-First Strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If it's a valid local request, clone and cache it
        if (response && response.status === 200 && (response.type === 'basic' || url.origin === self.location.origin)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch((err) => {
        console.log('[Service Worker] Fetch failed, serving from cache:', event.request.url, err);
        // Fallback to cache if offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If navigation page fails, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
