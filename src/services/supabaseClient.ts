/// <reference types="vite/client" />
import type { SupabaseClient } from '@supabase/supabase-js';

export type PublicSupabaseConfig = { url: string; publishableKey: string };
type PublicEnvironment = { VITE_SUPABASE_URL?: unknown; VITE_SUPABASE_PUBLISHABLE_KEY?: unknown };

/** A public API key is configuration, never proof of a visitor's identity. */
export function getPublicSupabaseConfig(environment: PublicEnvironment = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
}): PublicSupabaseConfig | undefined {
  const key = environment.VITE_SUPABASE_PUBLISHABLE_KEY;
  const rawUrl = environment.VITE_SUPABASE_URL;
  if (typeof key !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]{12,256}$/.test(key) || typeof rawUrl !== 'string') return undefined;
  try {
    const url = new URL(rawUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) return undefined;
    if (!(url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname)) && !(local && url.protocol === 'http:')) return undefined;
    return { url: url.origin, publishableKey: key };
  } catch { return undefined; }
}

export class QuietServiceUnavailableError extends Error {
  constructor() { super('Optional quiet service is unavailable'); this.name = 'QuietServiceUnavailableError'; }
}

let clientPromise: Promise<SupabaseClient | undefined> | undefined;
let guestPromise: Promise<SupabaseClient> | undefined;
let guestCaptcha: string | undefined;
let guestCaptchaConsumed = false;
const captchaListeners = new Set<() => void>();

/** Network requests have a deadline and never attach the browser's cookies. */
async function quietFetch(input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const signal = init?.signal;
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 8000);
  try { return await fetch(input, { ...init, credentials: 'omit', cache: 'no-store', signal: controller.signal }); }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

/** Called only after an optional panel is explicitly used; importing this file is inert. */
export async function getOptionalSupabaseClient(): Promise<SupabaseClient | undefined> {
  const config = getPublicSupabaseConfig();
  if (!config) return undefined;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: quietFetch },
      realtime: { params: { eventsPerSecond: 2 } },
    })).catch(() => { clientPromise = undefined; throw new QuietServiceUnavailableError(); });
  }
  return clientPromise;
}

/** Anonymous Auth rows persist server-side; only the session in this page is ephemeral. */
export async function getGuestSession({ captchaToken, onCaptchaConsumed }: { captchaToken?: string; onCaptchaConsumed?: () => void } = {}): Promise<SupabaseClient> {
  if (guestPromise) {
    if (onCaptchaConsumed && captchaToken && captchaToken === guestCaptcha) {
      if (guestCaptchaConsumed) onCaptchaConsumed();
      else captchaListeners.add(onCaptchaConsumed);
    }
    return guestPromise;
  }
  guestCaptcha = captchaToken; guestCaptchaConsumed = false;
  if (onCaptchaConsumed) captchaListeners.add(onCaptchaConsumed);
  guestPromise = (async () => {
    const client = await getOptionalSupabaseClient();
    if (!client) throw new QuietServiceUnavailableError();
    const { data, error } = await client.auth.getSession();
    if (error) throw new QuietServiceUnavailableError();
    if (data.session) {
      const verified = await client.auth.getUser();
      if (!verified.error && verified.data.user?.is_anonymous === true) return client;
      // A failed verification is not permission to create another account silently.
      throw new QuietServiceUnavailableError();
    }
    if (typeof captchaToken !== 'string' || !captchaToken.trim() || new TextEncoder().encode(captchaToken).length > 4096) throw new QuietServiceUnavailableError();
    guestCaptchaConsumed = true;
    for (const listener of captchaListeners) { try { listener(); } catch { /* A stale UI callback must not alter authentication. */ } }
    const signedIn = await client.auth.signInAnonymously({ options: { captchaToken } });
    if (signedIn.error || !signedIn.data.session || signedIn.data.user?.is_anonymous !== true) throw new QuietServiceUnavailableError();
    const verified = await client.auth.getUser();
    if (verified.error || verified.data.user?.is_anonymous !== true) throw new QuietServiceUnavailableError();
    return client;
  })().catch(() => { throw new QuietServiceUnavailableError(); }).finally(() => {
    guestPromise = undefined; guestCaptcha = undefined; guestCaptchaConsumed = false; captchaListeners.clear();
  });
  return guestPromise;
}

export function stopOptionalAuthRefresh(client: SupabaseClient) { client.auth.stopAutoRefresh(); }
