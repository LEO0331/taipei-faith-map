import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkSupabaseHealth, healthConfiguration } from './checkSupabaseHealth.mjs';

const rawRelations = ['quiet_notes', 'quiet_note_reports', 'quiet_rate_limits', 'quiet_corner_settings'];
const probes = [
  ['approved-read', '/rest/v1/rpc/get_approved_quiet_notes', 'POST'],
  ...rawRelations.map(name => [`private-${name}`, `/rest/v1/${name}?select=*&limit=1`, 'GET']),
];

function approvedProjection(value) {
  if (!Array.isArray(value) || value.length > 15) return false;
  const ids = new Set();
  return value.every(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row) || Object.keys(row).sort().join(',') !== 'content,expires_at,id') return false;
    if (typeof row.id !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(row.id) || ids.has(row.id)) return false;
    ids.add(row.id);
    if (typeof row.content !== 'string' || !row.content.trim() || new TextEncoder().encode(row.content).length > 1024) return false;
    if ([...new Intl.Segmenter('und', { granularity: 'grapheme' }).segment(row.content)].length > 80) return false;
    return typeof row.expires_at === 'string' && Number.isFinite(Date.parse(row.expires_at)) && Date.parse(row.expires_at) > Date.now();
  });
}

async function boundedJson(response) {
  if (!response.headers.get('content-type')?.includes('application/json') || !response.body) throw new Error('response');
  const reader = response.body.getReader(), chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 32768) throw new Error('response');
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally { void reader.cancel().catch(() => undefined); }
}

/** Public, read-only probes; no guest creation, mutation RPC or privileged credential. */
export async function validateQuietReadiness(env, { fetcher = fetch, timeoutMs = 8000 } = {}) {
  const config = healthConfiguration(env);
  if (!config) return { ok: false, checks: [{ name: 'configuration', ok: false }] };
  const checks = [];
  const health = await checkSupabaseHealth(env, { fetcher, timeoutMs });
  checks.push({ name: 'health-read', ok: health.ok });
  if (!health.ok) return { ok: false, checks };
  const origin = new URL(config.endpoint).origin;
  const deadline = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(10000, timeoutMs)) : 8000;
  for (const [name, path, method] of probes) {
    const controller = new AbortController();
    let timer, passed = false;
    try {
      const operation = async () => {
        const response = await fetcher(new URL(path, origin), {
          method, headers: { apikey: config.key, Accept: 'application/json', ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
          ...(method === 'POST' ? { body: JSON.stringify({ p_limit: 15 }) } : {}),
          credentials: 'omit', redirect: 'error', cache: 'no-store', signal: controller.signal,
        });
        if (name === 'approved-read') {
          if (response.status === 200) return approvedProjection(await boundedJson(response));
          void response.body?.cancel().catch(() => undefined);
          return false;
        }
        // Do not read or log a private body if a grant was accidentally opened.
        void response.body?.cancel().catch(() => undefined);
        return response.status === 401 || response.status === 403;
      };
      passed = await Promise.race([operation(), new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, deadline); })]);
    } catch { /* Report only the fixed probe name and pass/fail result. */ }
    finally { clearTimeout(timer); }
    checks.push({ name, ok: passed });
  }
  return { ok: checks.every(check => check.ok), checks };
}

export async function runQuietReadiness(env = process.env, options) {
  const result = await validateQuietReadiness(env, options);
  for (const check of result.checks) console.log(`Quiet readiness ${check.name}: ${check.ok ? 'passed' : 'failed'}.`);
  console.log('Read-only probes do not verify Auth, CAPTCHA, Realtime, pending status, moderation or scheduled retention. Keep activation gated on the operator checklist.');
  return result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runQuietReadiness().then(code => { process.exitCode = code; }).catch(() => { console.error('Quiet readiness failed. Inspect configuration privately.'); process.exitCode = 1; });
}
