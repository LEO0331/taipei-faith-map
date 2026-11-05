import { getSafeSourceUrl } from '../faith-spaces/culturalSources';

export type ReachabilityStatus = 'reachable' | 'redirected' | 'blocked' | 'timed-out' | 'unavailable';
export type SourceReachability = { url: string; status: ReachabilityStatus; httpStatus?: number; redirectTarget?: string; reason?: string };
export type ReachabilityOptions = { timeoutMs?: number; concurrency?: number; fetcher?: typeof fetch };

/** Manually invoked network observations; never a verdict on a source's factual accuracy. */
export async function auditSourceReachability(urls: string[], { timeoutMs = 8000, concurrency = 3, fetcher = fetch }: ReachabilityOptions = {}): Promise<SourceReachability[]> {
  const boundedTimeout = Number.isFinite(timeoutMs) ? Math.max(1000, Math.min(15000, Math.floor(timeoutMs))) : 8000;
  const boundedConcurrency = Number.isFinite(concurrency) ? Math.max(1, Math.min(4, Math.floor(concurrency))) : 3;
  const unique = [...new Set(urls.map(url => getSafeSourceUrl(url) ?? url))];
  const results: SourceReachability[] = new Array(unique.length);
  let cursor = 0;
  const check = async (url: string): Promise<SourceReachability> => {
    const safe = getSafeSourceUrl(url);
    if (!safe) return { url, status: 'unavailable', reason: 'Unsafe or invalid URL; no request sent.' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), boundedTimeout);
    try {
      const request = (method: 'HEAD' | 'GET') => fetcher(safe, { method, redirect: 'manual', credentials: 'omit', cache: 'no-store', signal: controller.signal });
      let response = await request('HEAD');
      if (response.status === 405 || response.status === 501) response = await request('GET');
      try { await response.body?.cancel(); } catch { /* Cleanup cannot change the observed HTTP status. */ }
      if (response.status >= 200 && response.status < 300) return { url: safe, status: 'reachable', httpStatus: response.status };
      if (response.status >= 300 && response.status < 400) {
        let redirectTarget: string | undefined;
        const location = response.headers.get('location');
        try { if (location) redirectTarget = getSafeSourceUrl(new URL(location, safe).href); } catch { /* Keep an invalid redirect as a redirect observation only. */ }
        return { url: safe, status: 'redirected', httpStatus: response.status, redirectTarget };
      }
      return { url: safe, status: [401, 403, 429].includes(response.status) ? 'blocked' : 'unavailable', httpStatus: response.status };
    } catch (error) {
      const aborted = controller.signal.aborted || (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name));
      return { url: safe, status: aborted ? 'timed-out' : 'unavailable', reason: aborted ? 'Request exceeded its bounded time allowance.' : 'Network or TLS request failed; investigate manually.' };
    } finally { clearTimeout(timer); }
  };
  await Promise.all(Array.from({ length: Math.min(boundedConcurrency, unique.length) }, async () => {
    while (cursor < unique.length) {
      const index = cursor++;
      results[index] = await check(unique[index]);
    }
  }));
  return results;
}
