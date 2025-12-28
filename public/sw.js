const CACHE_NAME = 'ai-calendar-v13-voice-viz';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    // Network first strategy for API calls, Cache first for assets
    if (e.request.url.includes('/auth') || e.request.url.includes('/events') || e.request.url.includes('/parseEvent')) {
        e.respondWith(fetch(e.request));
    } else {
        e.respondWith(
            caches.match(e.request).then((res) => res || fetch(e.request))
        );
    }
});
