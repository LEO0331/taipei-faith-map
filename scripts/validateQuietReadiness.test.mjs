import { afterEach, describe, expect, it, vi } from 'vitest';
import { runQuietReadiness, validateQuietReadiness } from './validateQuietReadiness.mjs';
const env = { SUPABASE_URL: 'https://sampleproject.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_only_key' };
const validNote = { id: '11111111-1111-4111-8111-111111111111', content: 'A calm moment.', expires_at: '2050-01-01T00:00:00Z' };
const fetcherFor = (notes = []) => vi.fn(async url => {
  const path = new URL(url).pathname;
  if (path.endsWith('app_healthcheck')) return Response.json([{ id: 1, status: 'ok' }]);
  if (path.includes('/rpc/')) return Response.json(notes);
  return Response.json({ message: 'private diagnostic must not be logged' }, { status: 401 });
});
afterEach(() => vi.restoreAllMocks());
describe('read-only optional-service readiness probes', () => {
  it.each([{}, { ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_never_public' }, { ...env, SUPABASE_PUBLISHABLE_KEY: 'eyJ.admin.jwt' }, { ...env, SUPABASE_URL: 'https://evil.example' }])('rejects missing/privileged/foreign configuration without any request', async config => {
    const fetcher = vi.fn();
    expect(await validateQuietReadiness(config, { fetcher })).toEqual({ ok: false, checks: [{ name: 'configuration', ok: false }] });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('checks health, a bounded approved projection and private relation denial with no Auth/mutation', async () => {
    const fetcher = fetcherFor([validNote]);
    expect(await validateQuietReadiness(env, { fetcher })).toMatchObject({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(6);
    for (const [url, init] of fetcher.mock.calls) {
      expect(new URL(url).origin).toBe(env.SUPABASE_URL);
      expect(init.headers.apikey).toBe(env.SUPABASE_PUBLISHABLE_KEY);
      expect(init.headers.Authorization).toBeUndefined();
      expect(init).toMatchObject({ credentials: 'omit', redirect: 'error', cache: 'no-store' });
      if (init.method === 'POST') {
        expect(new URL(url).pathname).toBe('/rest/v1/rpc/get_approved_quiet_notes');
        expect(JSON.parse(init.body)).toEqual({ p_limit: 15 });
      } else expect(init.method).toBe('GET');
    }
  });
  it.each([[{ ...validNote, author_key: 'private' }], [{ ...validNote, expires_at: '2000-01-01T00:00:00Z' }], [{ ...validNote, content: 'x'.repeat(81) }], [validNote, validNote], Array.from({ length: 16 }, () => validNote)])('rejects malformed or oversized public projection without claiming production readiness', async notes => {
    const result = await validateQuietReadiness(env, { fetcher: fetcherFor(notes) });
    expect(result.ok).toBe(false);
    expect(result.checks.find(check => check.name === 'approved-read').ok).toBe(false);
  });
  it.each([200, 404, 500])('fails when private relation returns status %s instead of a permission denial', async status => {
    const base = fetcherFor();
    const fetcher = vi.fn(async (url, init) => new URL(url).pathname.endsWith('quiet_notes') ? Response.json([], { status }) : base(url, init));
    const result = await validateQuietReadiness(env, { fetcher });
    expect(result.ok).toBe(false);
    expect(result.checks.find(check => check.name === 'private-quiet_notes').ok).toBe(false);
  });
  it.each([401, 403, 404, 500])('fails when the approved RPC returns HTTP %s', async status => {
    const base = fetcherFor();
    const fetcher = vi.fn(async (url, init) => new URL(url).pathname.includes('/rpc/') ? Response.json([], { status }) : base(url, init));
    const result = await validateQuietReadiness(env, { fetcher });
    expect(result.ok).toBe(false);
    expect(result.checks.find(check => check.name === 'approved-read').ok).toBe(false);
  });
  it('bounds an approved response body that stalls after headers', async () => {
    const base = fetcherFor();
    const fetcher = vi.fn(async (url, init) => new URL(url).pathname.includes('/rpc/') ? new Response(new ReadableStream({ start() {} }), { headers: { 'Content-Type': 'application/json' } }) : base(url, init));
    const result = await validateQuietReadiness(env, { fetcher, timeoutMs: 5 });
    expect(result.ok).toBe(false);
  });
  it('logs fixed probe names only and explicitly limits what success means', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    expect(await runQuietReadiness(env, { fetcher: fetcherFor() })).toBe(0);
    const output = log.mock.calls.flat().join(' ');
    expect(output).not.toContain(env.SUPABASE_PUBLISHABLE_KEY);
    expect(output).not.toContain(env.SUPABASE_URL);
    expect(output).not.toContain('private diagnostic');
    expect(output).toContain('do not verify Auth');
  });
});
