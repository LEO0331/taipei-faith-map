import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkSupabaseHealth, healthConfiguration, runHealthCheck } from './checkSupabaseHealth.mjs';

const env = { SUPABASE_URL: 'https://sampleproject.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public_test_only_key' };
const ok = () => Response.json([{ id: 1, status: 'ok' }]);
afterEach(() => vi.restoreAllMocks());

describe('Supabase database health read', () => {
  it.each([{}, { ...env, SUPABASE_URL: undefined }, { ...env, SUPABASE_PUBLISHABLE_KEY: '' }])('fails missing configuration without sending a request', async configuration => {
    const fetcher = vi.fn();
    expect(await checkSupabaseHealth(configuration, { fetcher })).toMatchObject({ ok: false, code: 'configuration', attempts: 0 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(['sb_secret_do_not_use', 'eyJhbGciOiJIUzI1NiJ9.service_role.signature', 'database-password', 'sb_publishable_key\nunsafe'])('rejects a key that is not a public publishable key', key => {
    expect(healthConfiguration({ ...env, SUPABASE_PUBLISHABLE_KEY: key })).toBeUndefined();
  });

  it.each(['http://sampleproject.supabase.co', 'https://sampleproject.supabase.co.evil.example', 'https://user:pass@sampleproject.supabase.co', 'https://sampleproject.supabase.co/rest/v1', 'https://sampleproject.supabase.co?key=secret', 'https://sampleproject.supabase.co/#secret', 'https://sampleproject.supabase.co:8443', 'https://localhost', 'https://127.0.0.1', 'https:\\sampleproject.supabase.co'])('rejects an ambiguous or nonproject URL: %s', url => {
    expect(healthConfiguration({ ...env, SUPABASE_URL: url })).toBeUndefined();
  });

  it('verifies one exact database record with a bounded SELECT and only the apikey credential', async () => {
    const fetcher = vi.fn().mockResolvedValue(ok());
    expect(await checkSupabaseHealth(env, { fetcher })).toMatchObject({ ok: true, code: 'ok', attempts: 1 });
    const [url, options] = fetcher.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/rest/v1/app_healthcheck');
    expect(Object.fromEntries(parsed.searchParams)).toEqual({ select: 'id,status', id: 'eq.1', limit: '1' });
    expect(options.method).toBe('GET');
    expect(options.headers).toEqual({ apikey: env.SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' });
    expect(options.credentials).toBe('omit');
    expect(options.redirect).toBe('error');
    expect(options.body).toBeUndefined();
  });

  it.each([[], [{ id: 2, status: 'ok' }], [{ id: 1, status: 'down' }], [{ id: 1, status: 'ok', author: 'private' }], [{ id: 1, status: 'ok' }, { id: 1, status: 'ok' }], { id: 1, status: 'ok' }])('rejects unexpected response content without retrying it', async value => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(value));
    expect(await checkSupabaseHealth(env, { fetcher })).toMatchObject({ ok: false, code: 'response', attempts: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects HTML, malformed JSON and oversized bodies', async () => {
    for (const response of [new Response('<h1>Error</h1>'), new Response('{', { headers: { 'content-type': 'application/json' } }), Response.json('x'.repeat(2048))]) {
      expect(await checkSupabaseHealth(env, { fetcher: vi.fn().mockResolvedValue(response) })).toMatchObject({ ok: false, code: 'response' });
    }
  });

  it.each([401, 403])('fails an unauthorized read safely and does not retry: %s', async status => {
    const fetcher = vi.fn().mockResolvedValue(new Response('Sensitive server diagnostic', { status }));
    const result = await checkSupabaseHealth(env, { fetcher });
    expect(result).toMatchObject({ ok: false, code: 'authentication', attempts: 1 });
    expect(JSON.stringify(result)).not.toContain('Sensitive');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('retries a temporary unavailable response once and succeeds on the real second read', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('Unavailable', { status: 503 })).mockResolvedValueOnce(ok());
    expect(await checkSupabaseHealth(env, { fetcher, retryDelayMs: 0 })).toMatchObject({ ok: true, attempts: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('ends repeated service failure after at most two read attempts', async () => {
    const fetcher = vi.fn().mockImplementation(async () => new Response('Unavailable', { status: 503 }));
    expect(await checkSupabaseHealth(env, { fetcher, retryDelayMs: 0 })).toMatchObject({ ok: false, code: 'unavailable', attempts: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  });

  it('times out even when a transport ignores cancellation and leaves no ongoing retry loop', async () => {
    const signals = [];
    const fetcher = vi.fn((_url, options) => { signals.push(options.signal); return new Promise(() => undefined); });
    expect(await checkSupabaseHealth(env, { fetcher, timeoutMs: 5, retryDelayMs: 0 })).toMatchObject({ ok: false, code: 'timeout', attempts: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(signals.every(signal => signal.aborted)).toBe(true);
  });

  it('keeps credentials, response content and transport exceptions out of output', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const fetcher = vi.fn().mockRejectedValue(new Error(`private ${env.SUPABASE_PUBLISHABLE_KEY} ${env.SUPABASE_URL}`));
    expect(await runHealthCheck(env, { fetcher, retryDelayMs: 0 })).toBe(1);
    const output = log.mock.calls.flat().join(' ');
    expect(output).toContain('health check failed');
    expect(output).not.toContain(env.SUPABASE_PUBLISHABLE_KEY);
    expect(output).not.toContain(env.SUPABASE_URL);
    expect(output).not.toContain('private');
    expect(await runHealthCheck(env, { fetcher: vi.fn().mockResolvedValue(ok()) })).toBe(0);
  });
});

describe('independent scheduled workflow contract', () => {
  it('runs three times daily or manually with minimal permissions and no deployment work', () => {
    const workflow = readFileSync(new URL('../.github/workflows/supabase-health-check.yml', import.meta.url), 'utf8');
    expect(workflow).toContain("cron: '17 2,10,18 * * *'");
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('timeout-minutes: 3');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow).toContain('run: node scripts/checkSupabaseHealth.mjs');
    expect(workflow).toContain('secrets.SUPABASE_PUBLISHABLE_KEY');
    expect(workflow).not.toMatch(/npm ci|npm run|supabase db|service.?role|sb_secret|SUPABASE_SECRET|pages:|id-token:|deployment|signInAnonymously/iu);
  });
});
