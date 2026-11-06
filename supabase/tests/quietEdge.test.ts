import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQuietHandler } from '../functions/_shared/quietHandler';
import { graphemeLength, validateNoteText } from '../functions/_shared/quietValidation';

const userId = '11111111-1111-4111-8111-111111111111';
const noteId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const environment: Record<string, string> = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'sb_publishable_test_only' }),
  SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'sb_secret_test_only' }),
  QUIET_IDENTITY_HASH_SECRET: 'test-hmac-key-at-least-thirty-two-characters',
  QUIET_ALLOWED_ORIGINS: 'https://app.example',
  QUIET_TURNSTILE_SECRET: 'turnstile-test-secret',
  QUIET_TURNSTILE_HOSTNAMES: 'app.example',
};

function setup(overrides: Record<string, string> = {}, options: { guest?: boolean; authStatus?: number; captcha?: Record<string, unknown>; rpcResult?: unknown; rpcStatus?: number } = {}) {
  const settings = { ...environment, ...overrides };
  const fetcher = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: userId, is_anonymous: options.guest ?? true }, { status: options.authStatus ?? 200 });
    if (url.includes('challenges.cloudflare.com')) return Response.json(options.captcha ?? { success: true, hostname: 'app.example', action: 'quiet-note' });
    expect(url).toMatch(/\/rest\/v1\/rpc\/(queue_quiet_note|report_quiet_note)$/);
    expect(new Headers(init?.headers).get('apikey')).toBe('sb_secret_test_only');
    expect(new Headers(init?.headers).has('authorization')).toBe(false);
    return Response.json(options.rpcResult ?? 'received', { status: options.rpcStatus ?? 200 });
  }) as unknown as ReturnType<typeof vi.fn<typeof fetch>>;
  const handler = (action: 'submit' | 'report' = 'submit') => createQuietHandler(action, { env: name => settings[name], fetcher });
  return { fetcher, handler };
}
function request(body: unknown = { content: '願你平安', captchaToken: 'fresh-test-token' }, headers: Record<string, string> = {}, method = 'POST') {
  return new Request('https://project.supabase.co/functions/v1/submit-quiet-note', {
    method,
    headers: { origin: 'https://app.example', authorization: 'Bearer header.payload.signature', 'content-type': 'application/json', ...headers },
    ...(method === 'OPTIONS' ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('server-authoritative note text limits', () => {
  it('counts Unicode graphemes and enforces a separate byte budget', () => {
    const family = '👩‍👩‍👧‍👦';
    expect(graphemeLength(family)).toBe(1);
    expect(validateNoteText('a'.repeat(80))).toBe('a'.repeat(80));
    expect(validateNoteText('a'.repeat(81))).toBeUndefined();
    expect(validateNoteText(family.repeat(40))).toBe(family.repeat(40));
    expect(validateNoteText(family.repeat(80))).toBeUndefined();
    expect(validateNoteText(`  平安\r\n喜樂  `)).toBe('平安\n喜樂');
  });
  it.each(['', '   ', '<script>alert(1)</script>', 'https://example.com', 'www.example.com', 'bad\u0000text', 'bad\u202etext', '\ud800'])('rejects malformed or unsupported text %j', text => {
    expect(validateNoteText(text)).toBeUndefined();
  });
});

describe('authenticated note Edge handler', () => {
  it('verifies Auth and CAPTCHA, uses an internal HMAC actor, and returns no pending metadata', async () => {
    const { handler, fetcher } = setup();
    const response = await handler()(request());
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('access-control-allow-origin')).toBe('https://app.example');
    expect(response.headers.has('access-control-allow-credentials')).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(3);
    const authHeaders = new Headers(fetcher.mock.calls[0][1]?.headers);
    expect(authHeaders.get('authorization')).toBe('Bearer header.payload.signature');
    expect(authHeaders.get('apikey')).toBe('sb_publishable_test_only');
    const captcha = JSON.parse(String(fetcher.mock.calls[1][1]?.body));
    expect(captcha).toEqual({ secret: 'turnstile-test-secret', response: 'fresh-test-token' });
    const mutation = JSON.parse(String(fetcher.mock.calls[2][1]?.body));
    expect(mutation.p_actor_key).toMatch(/^[a-f0-9]{64}$/);
    expect(mutation.p_actor_key).not.toBe(userId);
    expect(mutation).toEqual({ p_actor_key: expect.any(String), p_content: '願你平安' });
    expect(fetcher.mock.calls.every(([, init]) => init?.credentials === 'omit' && init?.redirect === 'error')).toBe(true);
  });

  it.each([
    { content: 'safe', status: 'approved', captchaToken: 'token' },
    { content: 'safe', authorId: userId, captchaToken: 'token' },
    { content: 'safe', religion: '道教', captchaToken: 'token' },
    { content: 'a'.repeat(81), captchaToken: 'token' },
    { content: 123, captchaToken: 'token' },
    [],
  ])('rejects invalid/extra client fields before any remote work: %j', async body => {
    const { handler, fetcher } = setup();
    expect((await handler()(request(body))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('bounds request bytes, rejects malformed JSON and requires JSON content type', async () => {
    const { handler, fetcher } = setup();
    expect((await handler()(request('{broken'))).status).toBe(400);
    expect((await handler()(request({ content: 'safe' }, { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await handler()(request('x'.repeat(4097)))).status).toBe(400);
    expect((await handler()(request({}, { 'content-length': '4097' }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects API keys as user JWTs and requires the Auth server to verify a real anonymous identity', async () => {
    const first = setup();
    expect((await first.handler()(request({}, { authorization: 'Bearer sb_publishable_test_only' }))).status).toBe(401);
    expect(first.fetcher).not.toHaveBeenCalled();
    const expired = setup({}, { authStatus: 401 });
    expect((await expired.handler()(request())).status).toBe(401);
    expect(expired.fetcher).toHaveBeenCalledTimes(1);
    const permanent = setup({}, { guest: false });
    expect((await permanent.handler()(request())).status).toBe(403);
    expect(permanent.fetcher).toHaveBeenCalledTimes(1);
  });

  it('handles preflight only for an explicit configured origin', async () => {
    const { handler, fetcher } = setup();
    const preflight = await handler()(request(undefined, {}, 'OPTIONS'));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-headers')).toContain('authorization');
    const blocked = await handler()(request({}, { origin: 'https://evil.example' }));
    expect(blocked.status).toBe(403);
    expect(blocked.headers.has('access-control-allow-origin')).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
    expect((await setup({ QUIET_ALLOWED_ORIGINS: '*' }).handler()(request())).status).toBe(503);
  });

  it.each([
    { success: false, hostname: 'app.example', action: 'quiet-note' },
    { success: true, hostname: 'evil.example', action: 'quiet-note' },
    { success: true, hostname: 'app.example', action: 'wrong-action' },
  ])('requires successful CAPTCHA with expected hostname/action: %j', async captcha => {
    const { handler, fetcher } = setup({}, { captcha });
    const response = await handler()(request());
    expect(response.status).toBe(400); expect(await response.json()).toEqual({ error: 'verification-required' });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('cannot disable CAPTCHA for a hosted project', async () => {
    const { handler, fetcher } = setup({ QUIET_CAPTCHA_REQUIRED: 'false' });
    expect((await handler()(request({ content: 'safe' }))).status).toBe(400);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await setup({ QUIET_TURNSTILE_SECRET: '' }).handler()(request())).status).toBe(503);
  });

  it.each([
    ['disabled', 503, 'posting-disabled'], ['duplicate', 409, 'duplicate'], ['rate-limited', 429, 'rate-limited'], ['invalid', 400, 'invalid-request'],
  ])('maps private database outcomes to safe public feedback: %s', async (rpcResult, status, error) => {
    const response = await setup({}, { rpcResult }).handler()(request());
    expect(response.status).toBe(status); expect(await response.json()).toEqual({ error });
  });

  it('reports only the bounded reason schema and uses a separate CAPTCHA action', async () => {
    const { handler, fetcher } = setup({}, { captcha: { success: true, hostname: 'app.example', action: 'quiet-report' } });
    const response = await handler('report')(request({ noteId, reason: 'spam', captchaToken: 'fresh-report-token' }));
    expect(await response.json()).toEqual({ ok: true });
    expect(String(fetcher.mock.calls[2][0])).toContain('/report_quiet_note');
    expect(JSON.parse(String(fetcher.mock.calls[2][1]?.body))).toEqual({ p_actor_key: expect.any(String), p_note_id: noteId, p_reason: 'spam' });
    expect((await handler('report')(request({ noteId, reason: 'free form reply', captchaToken: 'token' }))).status).toBe(400);
  });

  it('never forwards internal errors or credentials when dependencies fail', async () => {
    const settings = { ...environment };
    const fetcher = vi.fn().mockRejectedValue(new Error('sb_secret_test_only internal authentication details'));
    const response = await createQuietHandler('submit', { env: name => settings[name], fetcher })(request());
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"error":"unavailable"}');
  });

  it('aborts an unavailable dependency after a bounded timeout', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_input: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const response = createQuietHandler('submit', { env: name => environment[name], fetcher: fetcher as typeof fetch })(request());
    await vi.advanceTimersByTimeAsync(8001);
    expect((await response).status).toBe(503);
  });

  it.each([0, 1, 2])('keeps the deadline through a stalled JSON body at dependency %i', async stalledCall => {
    vi.useFakeTimers();
    const normal = setup().fetcher;
    const stalledBody = vi.fn(() => new Promise<unknown>(() => undefined));
    let stalledSignal: AbortSignal | null | undefined;
    let call = 0;
    const fetcher = vi.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      if (call++ !== stalledCall) return normal(input, init);
      stalledSignal = init?.signal;
      const response = Response.json({});
      response.json = stalledBody;
      return response;
    });
    const result = createQuietHandler('submit', { env: name => environment[name], fetcher })(request());
    await vi.waitFor(() => expect(stalledBody).toHaveBeenCalledOnce());
    await vi.advanceTimersByTimeAsync(8001);
    const response = await result;
    expect(stalledSignal?.aborted).toBe(true);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'unavailable' });
    expect(fetcher).toHaveBeenCalledTimes(stalledCall + 1);
  });
});
