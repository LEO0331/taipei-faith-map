const CACHE_NAME = 'taipei-faith-map-v2';
const SCOPE_URL = new URL(self.registration.scope);
const APP_SHELL = [
  './',
  './manifest.webmanifest',
  './data/religious-organizations.json',
  './data/religious-summary.json'
];
const DATA_PATH_SUFFIXES = ['/religious-organizations.json', '/religious-summary.json'];

function scopedUrl(path) {
  return new URL(path, SCOPE_URL).toString();
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL.map(scopedUrl))).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (DATA_PATH_SUFFIXES.some((suffix) => url.pathname.endsWith(suffix))) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function networkFirst(request) {
  try {
    return await fetchAndCache(request);
  } catch {
    return caches.match(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? fetchAndCache(request);
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  const clone = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  return response;
}
