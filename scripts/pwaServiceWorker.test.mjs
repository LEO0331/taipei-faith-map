import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const origin = 'https://example.test';
const scope = `${origin}/taipei-faith-map/`;
const current = 'taipei-faith-map:/taipei-faith-map/:v1.6a';
const key = path => new URL(path, scope).href;

function worker() {
  const listeners = new Map();
  const stores = new Map();
  const cache = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    return {
      match: vi.fn(async request => entries.get(typeof request === 'string' ? request : request.url)?.clone()),
      put: vi.fn(async (request, response) => entries.set(typeof request === 'string' ? request : request.url, response.clone())),
    };
  };
  const caches = { open: vi.fn(async name => cache(name)), keys: vi.fn(async () => [...stores.keys()]), delete: vi.fn(async name => stores.delete(name)) };
  const fetch = vi.fn(async () => new Response('new', { headers: { 'content-type': 'text/plain' } }));
  const skipWaiting = vi.fn(), claim = vi.fn();
  vm.runInNewContext(source, {
    self: { registration: { scope }, addEventListener: (name, callback) => listeners.set(name, callback), skipWaiting, clients: { claim } },
    caches, fetch, URL, Request, Response, AbortController, setTimeout, clearTimeout,
  }, { filename: fileURLToPath(new URL('../public/sw.js', import.meta.url)) });
  const respond = (path, init) => {
    const request = new Request(path.startsWith('http') ? path : key(path), init);
    let response;
    listeners.get('fetch')({ request, respondWith: value => { response = value; } });
    return response;
  };
  const event = async name => {
    let work;
    listeners.get(name)({ waitUntil: value => { work = value; } });
    await work;
  };
  return { stores, cache, caches, fetch, skipWaiting, claim, respond, event };
}

afterEach(() => vi.useRealTimers());

describe('scoped public-static service worker', () => {
  it.each([
    'https://project.supabase.co/rest/v1/quiet_notes',
    'https://project.supabase.co/auth/v1/token',
    'https://tile.openstreetmap.org/1/2/3.png',
    `${origin}/another-app/assets/main-abcdefgh.js`,
    'api/data', 'rest/v1/app_healthcheck', 'auth/v1/token',
    'assets/api', 'icons/private.svg', 'data/conversion-report.json',
    'data/religious-organizations.json?access_token=private',
    'assets/main-abcdefgh.js?token=private',
  ])('leaves %s completely outside cache/fetch interception', path => {
    const runtime = worker();
    expect(runtime.respond(path)).toBeUndefined();
    expect(runtime.fetch).not.toHaveBeenCalled();
    expect(runtime.caches.open).not.toHaveBeenCalled();
  });

  it.each([
    { method: 'POST', body: '{}' },
    { headers: { Authorization: 'Bearer private' } },
    { headers: { Range: 'bytes=0-9' } },
  ])('does not intercept mutations or credential/range requests', init => {
    const runtime = worker();
    expect(runtime.respond('data/religious-organizations.json', init)).toBeUndefined();
    expect(runtime.fetch).not.toHaveBeenCalled();
  });

  it('refreshes HTML online rather than indefinitely serving an old entry bundle', async () => {
    const runtime = worker();
    await runtime.cache(current).put(key(''), new Response('old HTML'));
    runtime.fetch.mockResolvedValue(new Response('new HTML'));
    expect(await (await runtime.respond('')).text()).toBe('new HTML');
    expect(await (await runtime.cache(current).match(key(''))).text()).toBe('new HTML');
    expect(runtime.fetch.mock.calls[0][1].cache).toBe('no-cache');
  });

  it('canonicalizes timestamped public JSON so offline retries work without growing query-key caches', async () => {
    const runtime = worker();
    expect(await (await runtime.respond('data/religious-organizations.json?v=123')).text()).toBe('new');
    runtime.fetch.mockRejectedValue(new Error('offline'));
    expect(await (await runtime.respond('data/religious-organizations.json?v=456')).text()).toBe('new');
    expect([...runtime.stores.get(current).keys()]).toEqual([key('data/religious-organizations.json')]);
  });

  it('reuses successful immutable chunks but never caches a missing chunk', async () => {
    const runtime = worker();
    await runtime.respond('assets/main-abcdefgh.js');
    runtime.fetch.mockClear();
    expect(await (await runtime.respond('assets/main-abcdefgh.js')).text()).toBe('new');
    expect(runtime.fetch).not.toHaveBeenCalled();
    runtime.fetch.mockResolvedValue(new Response('missing', { status: 404 }));
    expect((await runtime.respond('assets/lazy-abcdefgh.js')).status).toBe(404);
    expect(await runtime.cache(current).match(key('assets/lazy-abcdefgh.js'))).toBeUndefined();
  });

  it.each([500, 404])('does not replace a valid offline document with HTTP %s', async status => {
    const runtime = worker();
    await runtime.cache(current).put(key(''), new Response('good cached HTML'));
    runtime.fetch.mockResolvedValue(new Response('error', { status }));
    expect((await runtime.respond('')).status).toBe(status);
    expect(await (await runtime.cache(current).match(key(''))).text()).toBe('good cached HTML');
  });

  it.each(['no-store', 'private, max-age=10'])('does not cache a response marked %s', async value => {
    const runtime = worker();
    runtime.fetch.mockResolvedValue(new Response('private', { headers: { 'Cache-Control': value } }));
    await runtime.respond('');
    expect(await runtime.cache(current).match(key(''))).toBeUndefined();
  });

  it('uses only the current app cache for offline navigation and returns a truthful 503 if absent', async () => {
    const runtime = worker();
    await runtime.cache('unrelated').put(key(''), new Response('unrelated stale page'));
    runtime.fetch.mockRejectedValue(new Error('offline'));
    expect((await runtime.respond('')).status).toBe(503);
    await runtime.cache(current).put(key(''), new Response('own offline page'));
    expect(await (await runtime.respond('index.html')).text()).toBe('own offline page');
  });

  it('bounds stalled network work and falls back without waiting forever', async () => {
    vi.useFakeTimers();
    const runtime = worker();
    await runtime.cache(current).put(key(''), new Response('offline page'));
    runtime.fetch.mockImplementation(() => new Promise(() => {}));
    const response = runtime.respond('');
    await vi.advanceTimersByTimeAsync(4000);
    expect(await (await response).text()).toBe('offline page');
    expect(runtime.fetch.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it('keeps the deadline active when response headers arrive but the body stalls', async () => {
    vi.useFakeTimers();
    const runtime = worker();
    await runtime.cache(current).put(key(''), new Response('offline page'));
    runtime.fetch.mockResolvedValue({ clone: () => ({ arrayBuffer: () => new Promise(() => {}) }) });
    const response = runtime.respond('');
    await vi.advanceTimersByTimeAsync(4000);
    expect(await (await response).text()).toBe('offline page');
    expect(runtime.fetch.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it('does not break an online page when Cache Storage is unavailable', async () => {
    const runtime = worker();
    runtime.caches.open.mockRejectedValue(new Error('storage denied'));
    expect(await (await runtime.respond('')).text()).toBe('new');
  });

  it('cleans only this scope and known legacy caches on activation', async () => {
    const runtime = worker();
    for (const name of [current, 'taipei-faith-map:/taipei-faith-map/:old', 'taipei-faith-map-v1.5c', 'another-app-cache', 'taipei-faith-map:/another-copy/:old']) runtime.cache(name);
    await runtime.event('activate');
    expect([...runtime.stores.keys()]).toEqual([current, 'another-app-cache', 'taipei-faith-map:/another-copy/:old']);
    expect(runtime.claim).toHaveBeenCalledOnce();
  });

  it('prepares only the scoped shell and HTML-declared entry assets, leaving updates waiting', async () => {
    const runtime = worker();
    runtime.fetch.mockImplementation(async request => {
      const url = typeof request === 'string' ? request : request.url;
      return new Response(url === key('') ? '<script src="/taipei-faith-map/assets/main-abcdefgh.js"></script><link href="/taipei-faith-map/assets/main-abcdefgh.css"><script src="https://third.test/api.js"></script>' : 'asset');
    });
    await runtime.event('install');
    expect(runtime.skipWaiting).not.toHaveBeenCalled();
    const keys = [...runtime.stores.get(current).keys()];
    expect(keys).toContain(key('assets/main-abcdefgh.js'));
    expect(keys).toContain(key('assets/main-abcdefgh.css'));
    expect(keys.every(url => url.startsWith(scope))).toBe(true);
    expect(runtime.fetch).toHaveBeenCalledTimes(8);
  });
});
