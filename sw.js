// Libby Service Worker — emergency secure-dashboard routing
// Bump cache to discard stale Matthew-first chat shell on iPhone/PWA.
const CACHE = 'libby-v9-secure-dashboard-2026-05-07';
const SECURE_DASHBOARD = '/kellsie_secure.html?v=2026-05-07-sw-secure';
const SHELL = [
  '/',
  '/home',
  '/home.html',
  '/reset.html',
  '/kellsie',
  '/kellsie/',
  '/kellsie.html',
  '/kellsie_secure.html',
  '/sw.js',
  '/manifest.json',
  '/settings.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL.map(path => new Request(path, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() =>
        new Response(JSON.stringify({ ok: false, offline: true, error: 'Offline — server unreachable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  const secureRoutes = new Set(['/', '/home', '/home.html', '/kellsie', '/kellsie/', '/kellsie.html', '/libby_librarian.html']);
  if (secureRoutes.has(url.pathname)) {
    e.respondWith(Response.redirect(SECURE_DASHBOARD, 302));
    return;
  }

  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('/kellsie_secure.html') || Response.redirect(SECURE_DASHBOARD, 302)))
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'CLEAR_LIBBY_CACHES') {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});
