import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const messages = {
  configuration: 'Configure SUPABASE_URL and a public SUPABASE_PUBLISHABLE_KEY in repository secrets.',
  authentication: 'The public database read was not authorized. Check the public key and health relation read policy.',
  unavailable: 'The database read was unavailable. Check project status and try a manual run.',
  timeout: 'The database read exceeded its bounded timeout.',
  response: 'The database did not return the expected single health record.',
};

/** Only the hosted project Data API and a publishable key are accepted. */
export function healthConfiguration(env) {
  const rawUrl = env.SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (typeof rawUrl !== 'string' || typeof key !== 'string'
    || rawUrl !== rawUrl.trim() || /[\u0000-\u0020\u007f\\]/u.test(rawUrl)
    || !/^sb_publishable_[A-Za-z0-9_-]{10,512}$/u.test(key)) return undefined;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.port
      || !/^[a-z0-9][a-z0-9-]{1,62}\.supabase\.co$/u.test(url.hostname)
      || !['', '/'].includes(url.pathname) || url.search || url.hash) return undefined;
    const endpoint = new URL('/rest/v1/app_healthcheck', url.origin);
    endpoint.search = new URLSearchParams({ select: 'id,status', id: 'eq.1', limit: '1' }).toString();
    return { endpoint: endpoint.href, key };
  } catch { return undefined; }
}

async function readSmallJson(response) {
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json') || !response.body) throw new Error('response');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024) throw new Error('response');
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { try { await reader.cancel(); } catch { /* Nothing sensitive is logged. */ } }
}

const validHealthRecord = value => Array.isArray(value) && value.length === 1
  && value[0] && typeof value[0] === 'object' && !Array.isArray(value[0])
  && Object.keys(value[0]).sort().join(',') === 'id,status'
  && value[0].id === 1 && value[0].status === 'ok';

/** Real, read-only PostgreSQL access through PostgREST; never an Auth or shallow URL ping. */
export async function checkSupabaseHealth(env, { fetcher = fetch, timeoutMs = 8000, retryDelayMs = 100 } = {}) {
  const config = healthConfiguration(env);
  if (!config) return { ok: false, code: 'configuration', attempts: 0, message: messages.configuration };
  const boundedTimeout = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(10000, Math.floor(timeoutMs))) : 8000;
  const boundedDelay = Number.isFinite(retryDelayMs) ? Math.max(0, Math.min(500, Math.floor(retryDelayMs))) : 100;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    let timer;
    let code = 'unavailable';
    try {
      const operation = async () => {
        const response = await fetcher(config.endpoint, {
          method: 'GET', headers: { apikey: config.key, Accept: 'application/json' },
          credentials: 'omit', redirect: 'error', cache: 'no-store', signal: controller.signal,
        });
        if (response.status !== 200) {
          try { await response.body?.cancel(); } catch { /* Discard response text. */ }
          return { ok: false, code: [401, 403].includes(response.status) ? 'authentication' : 'unavailable' };
        }
        try { return { ok: validHealthRecord(await readSmallJson(response)), code: 'response' }; }
        catch { return { ok: false, code: 'response' }; }
      };
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, boundedTimeout);
      });
      const result = await Promise.race([operation(), timeout]);
      if (result.ok) return { ok: true, code: 'ok', attempts: attempt, message: 'Read-only database health record verified.' };
      code = result.code;
    } catch { code = controller.signal.aborted ? 'timeout' : 'unavailable'; }
    finally { clearTimeout(timer); }
    if (attempt === 2 || ['authentication', 'response'].includes(code)) return { ok: false, code, attempts: attempt, message: messages[code] };
    if (boundedDelay) await new Promise(resolveDelay => setTimeout(resolveDelay, boundedDelay));
  }
  return { ok: false, code: 'unavailable', attempts: 2, message: messages.unavailable };
}

export async function runHealthCheck(env = process.env, options) {
  const result = await checkSupabaseHealth(env, options);
  // Deliberately log only fixed text: no credentials, URL, response body or thrown error.
  console.log(result.ok ? 'Supabase database health check succeeded.' : `Supabase database health check failed (${result.code}). ${result.message}`);
  return result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runHealthCheck().then(code => { process.exitCode = code; }).catch(() => {
    console.error('Supabase database health check failed. Inspect project configuration privately.');
    process.exitCode = 1;
  });
}
