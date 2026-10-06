// Offline-friendly cache: HTML is network-first (always fresh when online), everything else is stale-while-revalidate.
const CACHE = 'shaton-v41';
const CORE = [
  './', 'index.html', 'portfolio.html',
  'vendor/gsap.min.js', 'vendor/ScrollTrigger.min.js',
  'fonts/unbounded-cyrillic-800.woff2', 'fonts/unbounded-latin-800.woff2',
  'fonts/manrope-cyrillic.woff2', 'fonts/manrope-latin.woff2',
  'fonts/oswald-cyrillic.woff2', 'fonts/oswald-latin.woff2',
  'fonts/montserrat-cyrillic-800.woff2', 'fonts/montserrat-latin-800.woff2',
  'fonts/spacemono-latin-400.woff2', 'fonts/spacemono-latin-700.woff2',
  'portrait-office.webp', 'portrait-toon.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/content/') >= 0 || url.pathname.indexOf('/posts/src/') >= 0) return; // admin-managed content is always live

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('index.html', copy));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((hit) => {
        const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    )
  );
});
