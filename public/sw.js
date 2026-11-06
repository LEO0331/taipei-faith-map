const SCOPE_URL = new URL(self.registration.scope);
const CACHE_PREFIX = `taipei-faith-map:${SCOPE_URL.pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}v1.6a`;
const LEGACY_CACHES = ['taipei-faith-map-v1.4', 'taipei-faith-map-v1.5a', 'taipei-faith-map-v1.5b', 'taipei-faith-map-v1.5c'];
const DATA_FILES = ['data/religious-organizations.json', 'data/religious-summary.json'];
const SHELL_FILES = ['', 'manifest.webmanifest', 'icons/icon-192.svg', 'icons/icon-512.svg', ...DATA_FILES];
const NETWORK_TIMEOUT_MS = 4000;

function scopedUrl(path) { return new URL(path, SCOPE_URL).href; }

// A deliberately small public-static allowlist. API/Auth responses, map tiles,
// arbitrary same-origin routes and credential-bearing requests bypass this worker.
function staticPath(request) {
  if (request.method !== 'GET' || request.headers.has('authorization') || request.headers.has('range')) return undefined;
  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return undefined;
  const path = url.pathname.slice(SCOPE_URL.pathname.length);
  if (DATA_FILES.includes(path)) {
    if ([...url.searchParams.keys()].some(key => key !== 'v') || (url.search && !/^\?v=\d+$/.test(url.search))) return undefined;
    return path;
  }
  if (url.search) return undefined;
  if (SHELL_FILES.includes(path) || path === 'index.html' || /^assets\/[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8}\.(?:js|css|woff2?|png|svg|webp)$/.test(path)) return path;
  return undefined;
}

function cacheable(response) {
  return response.ok && !response.redirected && ['basic', 'default'].includes(response.type)
    && !/(?:no-store|private)/i.test(response.headers.get('cache-control') || '');
}

async function fetchWithDeadline(request) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetch(request, { signal: controller.signal, cache: 'no-cache' });
        await response.clone().arrayBuffer();
        return response;
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Static network timeout')); }, NETWORK_TIMEOUT_MS); }),
    ]);
  } finally { clearTimeout(timer); }
}

async function save(cache, key, response) {
  if (cache && cacheable(response)) {
    try { await cache.put(key, response.clone()); } catch { /* Storage failure must not prevent an online response. */ }
  }
}

async function openCache() {
  try { return await caches.open(CACHE_NAME); } catch { return undefined; }
}

async function readCached(cache, key) {
  try { return await cache?.match(key); } catch { return undefined; }
}

async function networkFirst(request, path) {
  const cache = await openCache();
  const key = scopedUrl(path === 'index.html' ? '' : path);
  try {
    const response = await fetchWithDeadline(request);
    await save(cache, key, response);
    // A real HTTP error stays visible and never replaces a good offline copy.
    return response;
  } catch {
    return await readCached(cache, key) || new Response('Offline. Reconnect to load this page.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(request, path) {
  const cache = await openCache();
  const key = scopedUrl(path);
  const cached = await readCached(cache, key);
  if (cached) return cached;
  const response = await fetchWithDeadline(request);
  await save(cache, key, response);
  return response;
}

async function prepareShell() {
  const cache = await openCache();
  if (!cache) return;
  for (const path of SHELL_FILES) {
    try {
      const response = await fetchWithDeadline(scopedUrl(path));
      await save(cache, scopedUrl(path), response);
      // Cache the current entry bundle too. Lazy features are available offline
      // only after a controlled visit has fetched them; map tiles are never cached.
      if (path === '' && cacheable(response)) {
        const html = await response.text();
        const assets = new Set([...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => new URL(match[1], SCOPE_URL).href));
        for (const url of assets) {
          const request = new Request(url);
          const assetPath = staticPath(request);
          if (!assetPath?.startsWith('assets/')) continue;
          try { await save(cache, url, await fetchWithDeadline(request)); } catch { /* Partial offline availability is acceptable. */ }
        }
      }
    } catch { /* Registration can succeed with limited storage/connectivity. */ }
  }
}

self.addEventListener('install', event => {
  event.waitUntil(prepareShell());
  // Let an update wait for old clients to close. Do not reload an active scene or
  // draft, or delete chunks still used by an older controlled page.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME && (key.startsWith(CACHE_PREFIX) || LEGACY_CACHES.includes(key))).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const path = staticPath(event.request);
  if (path === undefined) return;
  const fresh = path === '' || path === 'index.html' || path === 'manifest.webmanifest' || DATA_FILES.includes(path);
  event.respondWith(fresh ? networkFirst(event.request, path) : cacheFirst(event.request, path));
});
