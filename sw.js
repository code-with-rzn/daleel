// Caches the app shell, and caches Quran/hadith data after first download so repeat searches work offline.
const SHELL = 'daleel-shell-v2', DATA = 'daleel-data-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(DATA).then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r;
    }));
  } else if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(SHELL).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request)));
  }
});
