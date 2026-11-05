import { describe, expect, it, vi } from 'vitest';
import { auditSourceReachability } from '../sourceReachability';

describe('optional unauthenticated source reachability checks', () => {
  it('distinguishes responses, avoids following redirects or sending credentials, and never requests unsafe URLs', async () => {
    const fetcher = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
      expect(options?.credentials).toBe('omit');
      expect(options?.redirect).toBe('manual');
      expect(options?.headers).toBeUndefined();
      const path = new URL(String(url)).pathname;
      return path === '/redirect' ? new Response(null, { status: 302, headers: { location: '/moved' } })
        : new Response(null, { status: path === '/blocked' ? 403 : path === '/missing' ? 404 : 200 });
    });
    const results = await auditSourceReachability(['https://example.org/ok', 'https://example.org/ok', 'https://example.org/redirect', 'https://example.org/blocked', 'https://example.org/missing', 'javascript:alert(1)'], { fetcher });
    expect(results.map(result => result.status)).toEqual(['reachable', 'redirected', 'blocked', 'unavailable', 'unavailable']);
    expect(results[1].redirectTarget).toBe('https://example.org/moved');
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('falls back from unsupported HEAD to GET and reports timeout/network failures without factual judgments', async () => {
    const fetcher = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
      if (String(url).endsWith('/timeout')) throw new DOMException('Timeout', 'AbortError');
      if (String(url).endsWith('/network')) throw new Error('TLS failed');
      return new Response(null, { status: options?.method === 'HEAD' ? 405 : 200 });
    });
    const results = await auditSourceReachability(['https://example.org/head', 'https://example.org/timeout', 'https://example.org/network'], { fetcher });
    expect(results.map(result => result.status)).toEqual(['reachable', 'timed-out', 'unavailable']);
    expect(fetcher.mock.calls.some(([, options]) => options?.method === 'GET')).toBe(true);
  });

  it('bounds concurrent work even when configured above the maximum', async () => {
    let active = 0, maximum = 0;
    const fetcher = vi.fn(async () => {
      active++; maximum = Math.max(maximum, active);
      await new Promise(resolve => setTimeout(resolve, 2));
      active--;
      return new Response(null, { status: 200 });
    });
    const results = await auditSourceReachability(Array.from({ length: 9 }, (_, index) => `https://example.org/${index}`), { fetcher, concurrency: 99 });
    expect(maximum).toBeLessThanOrEqual(4);
    expect(results).toHaveLength(9);
  });
});
