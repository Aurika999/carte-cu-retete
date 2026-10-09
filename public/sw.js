// Service worker: face aplicația instalabilă pe telefon și o lasă să se deschidă și fără internet.
// - pagina (navigare): întâi internetul, iar fără conexiune ultima versiune salvată;
// - fișierele aplicației (/assets/…, cu nume unic la fiecare versiune): din memorie, apoi internet;
// - pozele: din memorie dacă există, actualizate în fundal.
// Cererile către alte site-uri (Firebase, Google Fonts) nu trec prin aici.
// La o schimbare importantă a acestui fișier, crește VERSION ca să se golească memoria veche.
const VERSION = "v1";
const CORE = `bffh-core-${VERSION}`;
const ASSETS = `bffh-assets-${VERSION}`;
const IMAGES = `bffh-images-${VERSION}`;
const CORE_FILES = ["/", "/index.html", "/logo.svg", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CORE).then((c) => c.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  const keep = [CORE, ASSETS, IMAGES];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CORE);
    cache.put("/index.html", response.clone());
    return response;
  } catch {
    return (await caches.match("/index.html")) || (await caches.match("/")) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => { if (response.ok) cache.put(request, response.clone()); return response; })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
  } else if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, ASSETS));
  } else if (/\.(png|jpe?g|webp|svg|gif)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGES));
  }
});
