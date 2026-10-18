/* CitaMed: service worker mínimo.
 * Objetivo: que la app sea instalable y abra rápido. No guarda datos clínicos ni respuestas del API:
 * solo el armazón de la página y los archivos con huella (/assets/*), que nunca cambian de contenido.
 * Las peticiones a otros orígenes (el API) y las que no son GET pasan directo a la red.
 * Al cambiar de versión, cambia CACHE y se borran las cachés viejas. */

const CACHE = 'citamed-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // el API y otros servicios van directo a la red

  // Navegación: red primero para ver siempre la versión nueva; sin conexión, el armazón guardado
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/').then((res) => res || Response.error()))
    );
    return;
  }

  // Archivos con huella: caché primero (su nombre cambia cuando cambia el contenido)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
