/**
 * Meridian-7 service worker — offline cache for core assets
 */
const CACHE = 'meridian7-v21';
const PRECACHE = [
  'index.html',
  '404.html',
  '500.html',
  'left.html',
  'right.html',
  'brain/index.html',
  'terminal.html',
  'breach.html',
  'network.html',
  'cipher.html',
  'sim.html',
  'intercept.html',
  'forge.html',
  'archive.html',
  'heist.html',
  'cartography.html',
  'lab.html',
  'memorial.html',
  'resonance.html',
  'motd.html',
  'trophy.html',
  'debrief.html',
  'read.html',
  'experience-modules/shared/dio-guide.js',
  'experience-modules/shared/dio-guide.css',
  'experience-modules/shared/narrative-engine.js',
  'experience-modules/shared/debrief-generator.js',
  'favicon.ico',
  'favicon-32.png',
  'apple-touch-icon.png',
  'assets/siem-core.js',
  'assets/siem-qol.js',
  'assets/palette.js',
  'assets/palette.css',
  'assets/deck-nav.js',
  'assets/deck-nav.css',
  'assets/guides-manifest.json',
  'assets/marked.min.js',
  'experience-modules/index.html',
  'experience-modules/shared/physics-bridge.js',
  'experience-modules/leaderboards/manifest.json',
  'experience-modules/shared/progression-manager.js',
  'experience-modules/shared/learning-system.js',
  'experience-modules/shared/leaderboard-manager.js',
  'experience-modules/shared/game-engine-base.js',
  'experience-modules/shared/game-shell.js',
  'experience-modules/shared/styles-base.css',
  'experience-modules/game1-terminal/index.html',
  'experience-modules/game1-terminal/game.js',
  'experience-modules/game1-terminal/styles.css',
  'experience-modules/game2-breach/index.html',
  'experience-modules/game2-breach/game.js',
  'experience-modules/game2-breach/styles.css',
  'experience-modules/game3-network/index.html',
  'experience-modules/game3-network/game.js',
  'experience-modules/game3-network/styles.css',
  'experience-modules/game4-cipher/index.html',
  'experience-modules/game4-cipher/game.js',
  'experience-modules/game4-cipher/styles.css',
  'experience-modules/game5-simulation/index.html',
  'experience-modules/game5-simulation/game.js',
  'experience-modules/game5-simulation/styles.css',
  'experience-modules/game6-intercept/index.html',
  'experience-modules/game6-intercept/game.js',
  'experience-modules/game6-intercept/styles.css',
  'experience-modules/game7-forge/index.html',
  'experience-modules/game7-forge/game.js',
  'experience-modules/game7-forge/styles.css',
  'experience-modules/game8-archive/index.html',
  'experience-modules/game8-archive/game.js',
  'experience-modules/game8-archive/styles.css',
  'experience-modules/game9-heist/index.html',
  'experience-modules/game9-heist/game.js',
  'experience-modules/game9-heist/styles.css',
  'experience-modules/game10-lab/index.html',
  'experience-modules/game10-lab/game.js',
  'experience-modules/game10-lab/styles.css',
  'experience-modules/game11-cartography/index.html',
  'experience-modules/game11-cartography/game.js',
  'experience-modules/game11-cartography/styles.css',
  'experience-modules/game12-memorial/index.html',
  'experience-modules/game12-memorial/game.js',
  'experience-modules/game12-memorial/styles.css',
  'experience-modules/game13-resonance/index.html',
  'experience-modules/game13-resonance/game.js',
  'experience-modules/game13-resonance/styles.css',
  'experience-modules/leaderboards/the_terminal-speedTrial-any.json',
  'experience-modules/leaderboards/the_breach-speedTrial-any.json',
  'experience-modules/leaderboards/the_resonance-speedTrial-any.json',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE.map(function (u) {
        try { return new URL(u, self.location.href).href; } catch (_) { return u; }
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

  /* read.html uses query params for doc path — never serve a cached copy without the query string */
  if (url.pathname.endsWith('/read.html') || url.pathname === '/read.html') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      /* Versioned assets (e.g. deck-nav.js?v=16.1) may not be in the precache under
         the versioned URL — fall back to the unversioned precache entry offline. */
      var exactOrFallback = cached || (url.search
        ? caches.match(event.request, { ignoreSearch: true })
        : Promise.resolve(null));
      return Promise.resolve(exactOrFallback).then(function (hit) {
        var fetchPromise = fetch(event.request).then(function (res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put(event.request, clone); });
          }
          return res;
        }).catch(function () { return hit; });
        return hit || fetchPromise;
      });
    })
  );
});
