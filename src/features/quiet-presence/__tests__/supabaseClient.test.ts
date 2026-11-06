import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ session: null as unknown, anonymous: true, verifyError: false }));
const client = vi.hoisted(() => ({ auth: {
  getSession: vi.fn(async () => ({ data: { session: state.session }, error: null })),
  getUser: vi.fn(async () => ({ data: { user: { is_anonymous: state.anonymous } }, error: state.verifyError ? new Error('Invalid JWT') : null })),
  signInAnonymously: vi.fn(async () => { state.session = { access_token: 'private-session-token', user: { is_anonymous: true } }; return { data: { session: state.session, user: { is_anonymous: true } }, error: null }; }),
  stopAutoRefresh: vi.fn(),
} }));
const createClient = vi.hoisted(() => vi.fn(() => client));
vi.mock('@supabase/supabase-js', () => ({ createClient }));

beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); state.session = null; state.anonymous = true; state.verifyError = false;
  vi.stubEnv('VITE_SUPABASE_URL', 'https://exampleproject.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_examplepublickey12345');
});
afterEach(() => vi.unstubAllEnvs());

describe('optional guest client', () => {
  it('does not initialize SDK or guest Auth just by importing configuration', async () => {
    const service = await import('../../../services/supabaseClient');
    expect(createClient).not.toHaveBeenCalled();
    const result = await service.getOptionalSupabaseClient();
    expect(result).toBe(client);
    expect(client.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(createClient).toHaveBeenCalledWith('https://exampleproject.supabase.co', 'sb_publishable_examplepublickey12345', expect.objectContaining({ auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }));
  });

  it('rejects privileged, legacy and malformed public configuration', async () => {
    const { getPublicSupabaseConfig } = await import('../../../services/supabaseClient');
    for (const key of ['sb_secret_private12345', 'eyJserviceRoleToken', '', 'sb_publishable_short']) expect(getPublicSupabaseConfig({ VITE_SUPABASE_URL: 'https://exampleproject.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: key })).toBeUndefined();
    for (const url of ['http://example.com', 'https://example.com', 'https://user:secret@exampleproject.supabase.co', 'https://exampleproject.supabase.co/path', 'https://exampleproject.supabase.co?secret=x']) expect(getPublicSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_examplepublickey12345' })).toBeUndefined();
    expect(getPublicSupabaseConfig({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_examplepublickey12345' })?.url).toBe('http://127.0.0.1:54321');
  });

  it('requires CAPTCHA for a new guest and signals single-use consumption once', async () => {
    const service = await import('../../../services/supabaseClient');
    await expect(service.getGuestSession()).rejects.toThrow('unavailable');
    expect(client.auth.signInAnonymously).not.toHaveBeenCalled();
    const consumed = vi.fn();
    await service.getGuestSession({ captchaToken: 'captcha-proof', onCaptchaConsumed: consumed });
    expect(consumed).toHaveBeenCalledOnce();
    expect(client.auth.signInAnonymously).toHaveBeenCalledExactlyOnceWith({ options: { captchaToken: 'captcha-proof' } });
    consumed.mockClear();
    await service.getGuestSession({ captchaToken: 'fresh-proof', onCaptchaConsumed: consumed });
    expect(consumed).not.toHaveBeenCalled();
    expect(client.auth.signInAnonymously).toHaveBeenCalledOnce();
  });

  it('deduplicates simultaneous registrations and verifies a reused anonymous session', async () => {
    const service = await import('../../../services/supabaseClient');
    const results = await Promise.all([service.getGuestSession({ captchaToken: 'one-proof' }), service.getGuestSession({ captchaToken: 'one-proof' })]);
    expect(results).toEqual([client, client]); expect(client.auth.signInAnonymously).toHaveBeenCalledOnce();
    await service.getGuestSession();
    expect(client.auth.getUser).toHaveBeenCalledTimes(2);
    expect(client.auth.signInAnonymously).toHaveBeenCalledOnce();
  });

  it('does not silently register replacements for rejected or non-anonymous identities', async () => {
    state.session = { access_token: 'existing', user: { is_anonymous: false } }; state.anonymous = false;
    const service = await import('../../../services/supabaseClient');
    await expect(service.getGuestSession({ captchaToken: 'proof' })).rejects.toThrow('unavailable');
    state.anonymous = true; state.verifyError = true;
    await expect(service.getGuestSession({ captchaToken: 'proof' })).rejects.toThrow('unavailable');
    expect(client.auth.signInAnonymously).not.toHaveBeenCalled();
  });
});
