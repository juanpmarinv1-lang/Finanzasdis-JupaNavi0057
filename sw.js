const CACHE_NAME = 'finanzas-cache-v1';
const ARCHIVOS_BASE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ARCHIVOS_BASE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres
          .filter(function (nombre) { return nombre !== CACHE_NAME; })
          .map(function (nombre) { return caches.delete(nombre); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  // Solo controlamos peticiones GET de nuestro propio origen (el "cascarón" de la app).
  // Todo lo demás (Firestore, fuentes de Google, etc.) sigue directo a la red normalmente.
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (respuestaCache) {
      const fetchPromise = fetch(event.request)
        .then(function (respuestaRed) {
          if (respuestaRed && respuestaRed.status === 200) {
            const copia = respuestaRed.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copia); });
          }
          return respuestaRed;
        })
        .catch(function () { return respuestaCache; });
      return respuestaCache || fetchPromise;
    })
  );
});
