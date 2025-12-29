const CACHE_NAME = 'ai-calendar-v14-sync-fix'; // Bumped version
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    // 🚀 Force new SW to activate immediately
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    // 🧹 Clean old caches and take control immediately
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    // 🌐 Network First Strategy (Fixes "Hard Reload" issue)
    // Try to get fresh content first, fall back to cache if offline
    e.respondWith(
        fetch(e.request)
            .then(response => {
                // Return fresh response
                return response;
            })
            .catch(() => {
                // Network failed? Try cache
                return caches.match(e.request);
            })
    );
});
