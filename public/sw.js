// Service Worker with aggressive cache clearing for always-fresh content
const CACHE_VERSION = 'v' + Date.now(); // Unique version per deployment

// Install: Skip waiting immediately
self.addEventListener('install', (event) => {
    console.log('[SW] Installing new version:', CACHE_VERSION);
    self.skipWaiting();
});

// Activate: Clear ALL old caches immediately
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating:', CACHE_VERSION);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete all caches regardless of name
                    console.log('[SW] Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Claim all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch: Always try network first, fallback to cache only if offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Network success - return fresh response
                return response;
            })
            .catch(() => {
                // Network failed - try cache as fallback
                return caches.match(event.request);
            })
    );
});

// Listen for messages to force update
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
