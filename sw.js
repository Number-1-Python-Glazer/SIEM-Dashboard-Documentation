/**
 * Meridian-7 service worker — offline cache for core assets
 */
const CACHE = 'meridian7-v16.1';
const PRECACHE = [
  '/',
  '/index.html',
  '/404.html',
  '/500.html',
  '/left.html',
  '/right.html',
  '/brain/index.html',
  '/terminal.html',
  '/breach.html',
  '/network.html',
  '/cipher.html',
  '/sim.html',
  '/intercept.html',
  '/forge.html',
  '/archive.html',
  '/heist.html',
  '/cartography.html',
  '/lab.html',
  '/memorial.html',
  '/resonance.html',
  '/motd.html',
  '/trophy.html',
  '/favicon.ico',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/assets/siem-core.js',
  '/assets/siem-qol.js',
  '/assets/palette.js',
  '/assets/palette.css',
  '/assets/deck-nav.js',
  '/assets/deck-nav.css',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE.map(function (u) {
        try { return new URL(u, self.location.origin).href; } catch (_) { return u; }
      })).catch(function () { /* partial ok */ });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.match(/\.(html|js|css|json|svg|woff2?)$/i) && !url.pathname.endsWith('/')) return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var fetchPromise = fetch(event.request).then(function (res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(event.request, clone); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
