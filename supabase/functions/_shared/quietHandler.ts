import { REQUEST_BYTE_LIMIT, REPORT_REASONS, hasOnlyKeys, isRecord, isUuid, validCaptchaToken, validateNoteText } from './quietValidation.ts';

type Environment = (name: string) => string | undefined;
type Dependencies = { env: Environment; fetcher?: typeof fetch };
type Action = 'submit' | 'report';
type Settings = { url: URL; publishable: string; secret: string; hashSecret: string; origins: Set<string>; captchaRequired: boolean; captchaSecret?: string; captchaHosts: Set<string> };

function configuration(env: Environment): Settings | undefined {
  try {
    const url = new URL(env('SUPABASE_URL') ?? '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || (url.hostname === 'kong' && env('QUIET_LOCAL_TEST_MODE') === 'true');
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') return undefined;
    // These dictionaries are injected by Supabase; custom SUPABASE_ secrets are reserved.
    const publishable = JSON.parse(env('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default ?? '';
    const secret = JSON.parse(env('SUPABASE_SECRET_KEYS') ?? '{}').default ?? '';
    const hashSecret = env('QUIET_IDENTITY_HASH_SECRET') ?? '';
    if (!/^sb_publishable_[a-zA-Z0-9_-]+$/u.test(publishable) || !/^sb_secret_[a-zA-Z0-9_-]+$/u.test(secret) || hashSecret.length < 32) return undefined;
    const origins = new Set((env('QUIET_ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean));
    if (!origins.size || [...origins].some(value => { const parsed = new URL(value); return parsed.origin !== value || (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))); })) return undefined;
    const captchaRequired = env('QUIET_CAPTCHA_REQUIRED') !== 'false' || !local;
    const captchaSecret = env('QUIET_TURNSTILE_SECRET');
    const captchaHosts = new Set((env('QUIET_TURNSTILE_HOSTNAMES') ?? '').split(',').map(value => value.trim()).filter(Boolean));
    if (captchaRequired && (!captchaSecret || !captchaHosts.size)) return undefined;
    return { url, publishable, secret, hashSecret, origins, captchaRequired, captchaSecret, captchaHosts };
  } catch { return undefined; }
}

async function fetchJsonWithTimeout(fetcher: typeof fetch, input: string | URL, init: RequestInit) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new Error('Service deadline exceeded')); }, 8000);
  });
  // Fetch resolves at headers. Keep the same deadline until the JSON body is read.
  const operation = async () => {
    const response = await fetcher(input, { ...init, signal: controller.signal, redirect: 'error', credentials: 'omit' });
    return { ok: response.ok, data: response.ok ? await response.json() as unknown : null };
  };
  try { return await Promise.race([operation(), deadline]); }
  finally { if (timer !== undefined) clearTimeout(timer); }
}

async function readJson(request: Request): Promise<unknown> {
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/u.test(declared) || Number(declared) > REQUEST_BYTE_LIMIT)) throw new Error('invalid-request');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid-request');
  const parts: Uint8Array[] = []; let length = 0;
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => undefined); }, 8000);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > REQUEST_BYTE_LIMIT) { await reader.cancel(); throw new Error('invalid-request'); }
      parts.push(value);
    }
    if (timedOut) throw new Error('invalid-request');
  } finally { clearTimeout(timer); reader.releaseLock(); }
  const body = new Uint8Array(length); let offset = 0;
  for (const part of parts) { body.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
}

async function actorKey(userId: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId)));
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

/** The platform also keeps verify_jwt=true; this handler independently verifies Auth. */
export function createQuietHandler(action: Action, { env, fetcher = fetch }: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const settings = configuration(env);
    const origin = request.headers.get('origin') ?? '';
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' });
    const reply = (status: number, error?: string) => new Response(JSON.stringify(error ? { error } : { ok: true }), { status, headers });
    if (!settings) return reply(503, 'unavailable');
    if (!settings.origins.has(origin)) return reply(403, 'unavailable');
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, 'invalid-request');
    if (!/^application\/json(?:\s*;.*)?$/iu.test(request.headers.get('content-type') ?? '')) return reply(415, 'invalid-request');
    const authorization = request.headers.get('authorization') ?? '';
    if (authorization.length > 4096 || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/iu.test(authorization)) return reply(401, 'authentication-required');
    let body: unknown;
    try { body = await readJson(request); } catch { return reply(400, 'invalid-request'); }
    try {
      const keys = action === 'submit' ? ['content', 'captchaToken'] : ['noteId', 'reason', 'captchaToken'];
      if (!isRecord(body) || !hasOnlyKeys(body, keys)) return reply(400, 'invalid-request');
      const content = action === 'submit' ? validateNoteText(body.content) : undefined;
      if (action === 'submit' ? !content : !isUuid(body.noteId) || !REPORT_REASONS.includes(body.reason as typeof REPORT_REASONS[number])) return reply(400, 'invalid-request');
      const userResponse = await fetchJsonWithTimeout(fetcher, new URL('/auth/v1/user', settings.url), { headers: { apikey: settings.publishable, Authorization: authorization } });
      if (!userResponse.ok) return reply(401, 'authentication-required');
      const user = userResponse.data;
      if (!isRecord(user) || !isUuid(user.id) || user.is_anonymous !== true) return reply(403, 'guest-session-required');
      if (settings.captchaRequired) {
        if (!validCaptchaToken(body.captchaToken)) return reply(400, 'verification-required');
        const captchaResponse = await fetchJsonWithTimeout(fetcher, 'https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: settings.captchaSecret, response: body.captchaToken }),
        });
        const verification = captchaResponse.data;
        if (!isRecord(verification) || verification.success !== true || !settings.captchaHosts.has(String(verification.hostname)) || verification.action !== (action === 'submit' ? 'quiet-note' : 'quiet-report')) return reply(400, 'verification-required');
      }
      const actor = await actorKey(user.id, settings.hashSecret);
      const rpc = action === 'submit' ? 'queue_quiet_note' : 'report_quiet_note';
      const payload = action === 'submit' ? { p_actor_key: actor, p_content: content } : { p_actor_key: actor, p_note_id: body.noteId, p_reason: body.reason };
      const response = await fetchJsonWithTimeout(fetcher, new URL(`/rest/v1/rpc/${rpc}`, settings.url), { method: 'POST', headers: { apikey: settings.secret, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) return reply(503, 'unavailable');
      const result = response.data;
      if (result === 'received') return reply(200);
      if (result === 'disabled') return reply(503, 'posting-disabled');
      if (result === 'rate-limited') return reply(429, 'rate-limited');
      if (result === 'duplicate') return reply(409, 'duplicate');
      if (result === 'unavailable') return reply(404, 'unavailable');
      return reply(400, 'invalid-request');
    } catch { return reply(503, 'unavailable'); }
  };
}
