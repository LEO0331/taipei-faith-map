import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readApprovedNotes, reportQuietNote, sanitizeApprovedNotes, submitQuietNote } from '../quietCornerClient';

const mocks = vi.hoisted(() => ({ optional: vi.fn(), guest: vi.fn(), rpc: vi.fn(), invoke: vi.fn(), flags: vi.fn() }));
vi.mock('../../../utils/featureFlags', () => ({ getFeatureFlags: mocks.flags }));
vi.mock('../../../services/supabaseClient', () => ({ getOptionalSupabaseClient: mocks.optional, getGuestSession: mocks.guest }));
const row = { id: '11111111-1111-4111-8111-111111111111', content: 'A calm moment.', expires_at: '2050-01-01T00:00:00Z' };
const client = { rpc: mocks.rpc, functions: { invoke: mocks.invoke } };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.flags.mockReturnValue({ quietCorner: true });
  mocks.optional.mockResolvedValue(client); mocks.guest.mockResolvedValue(client);
  mocks.rpc.mockReturnValue({ abortSignal: vi.fn().mockResolvedValue({ data: [row], error: null }) });
  mocks.invoke.mockResolvedValue({ data: { ok: true }, error: null });
});
afterEach(() => vi.useRealTimers());

describe('Quiet Corner client', () => {
  it('reads a bounded display-only RPC without creating a guest session', async () => {
    expect(await readApprovedNotes()).toEqual([{ id: row.id, content: row.content, expiresAt: row.expires_at }]);
    expect(mocks.rpc).toHaveBeenCalledWith('get_approved_quiet_notes', { p_limit: 15 });
    expect(mocks.guest).not.toHaveBeenCalled();
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('strips author and moderation metadata while rejecting hidden, expired and malformed rows', () => {
    const notes = sanitizeApprovedNotes([
      { ...row, author_id: 'private-author', reviewed_at: 'private', status: 'approved' },
      { ...row, id: '22222222-2222-4222-8222-222222222222', status: 'pending' },
      { ...row, id: '33333333-3333-4333-8333-333333333333', status: 'hidden' },
      { ...row, id: '44444444-4444-4444-8444-444444444444', expires_at: '2020-01-01T00:00:00Z' },
      { ...row, id: 'not-a-uuid' }, null,
    ], Date.parse('2026-11-05T00:00:00Z'));
    expect(notes).toEqual([{ id: row.id, content: row.content, expiresAt: row.expires_at }]);
    expect(() => sanitizeApprovedNotes({ message: 'malformed' })).toThrow('unavailable');
  });
  it('only submits valid text after an explicit guest action and sends no location or religion fields', async () => {
    await expect(submitQuietNote(' ')).rejects.toThrow('invalid');
    expect(mocks.guest).not.toHaveBeenCalled();
    await submitQuietNote('  A good wish.  ', 'fresh-token');
    expect(mocks.invoke).toHaveBeenCalledWith('submit-quiet-note', expect.objectContaining({ body: { content: 'A good wish.', captchaToken: 'fresh-token' }, timeout: 10000 }));
    expect(mocks.guest).toHaveBeenCalledWith(expect.objectContaining({ captchaToken: 'fresh-token' }));
  });
  it('does not reuse a CAPTCHA token consumed by new anonymous authentication', async () => {
    mocks.guest.mockImplementationOnce(async (options: { onCaptchaConsumed?: () => void }) => { options.onCaptchaConsumed?.(); return client; });
    await expect(submitQuietNote('A good wish.', 'auth-token')).rejects.toThrow('fresh-verification');
    expect(mocks.invoke).not.toHaveBeenCalled();
    await submitQuietNote('A good wish.', 'new-edge-token');
    expect(mocks.invoke).toHaveBeenCalledOnce();
  });
  it('requires acknowledgement, exposes only safe failure codes and never treats pending content as public', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { error: 'posting-disabled', internal: 'not-for-display' }, error: null });
    await expect(submitQuietNote('A good wish.', 'token')).rejects.toThrow('posting-disabled');
    mocks.invoke.mockResolvedValueOnce({ data: { content: 'fake published note' }, error: null });
    await expect(submitQuietNote('A good wish.', 'token')).rejects.toThrow('unavailable');
  });
  it('reads only recognized failure codes from an SDK HTTP-error response', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response(JSON.stringify({ error: 'rate-limited', privateDetail: 'not public' }), { status: 429, headers: { 'content-type': 'application/json' } }) } });
    await expect(submitQuietNote('A good wish.', 'token')).rejects.toThrow('rate-limited');
    mocks.invoke.mockResolvedValueOnce({ data: null, error: { context: new Response('Internal proxy details', { status: 503 }) } });
    await expect(submitQuietNote('A good wish.', 'token')).rejects.toThrow('unavailable');
  });
  it('uses a bounded report schema and rejects unknown reasons before authentication', async () => {
    await expect(reportQuietNote(row.id, 'unknown' as 'other')).rejects.toThrow('invalid');
    expect(mocks.guest).not.toHaveBeenCalled();
    await reportQuietNote(row.id, 'personal-data', 'report-token');
    expect(mocks.invoke).toHaveBeenCalledWith('report-quiet-note', expect.objectContaining({ body: { noteId: row.id, reason: 'personal-data', captchaToken: 'report-token' } }));
  });
  it('does not initialize any service while disabled and stops an abandoned read', async () => {
    mocks.flags.mockReturnValueOnce({ quietCorner: false });
    await expect(readApprovedNotes()).rejects.toThrow('unavailable');
    expect(mocks.optional).not.toHaveBeenCalled();
    const controller = new AbortController();
    mocks.rpc.mockReturnValueOnce({ abortSignal: vi.fn().mockReturnValue(new Promise(() => undefined)) });
    const result = readApprovedNotes(controller.signal);
    controller.abort();
    await expect(result).rejects.toThrow('unavailable');
  });

  it('bounds a stalled read and never invokes an Edge Function after guest authentication fails', async () => {
    mocks.guest.mockRejectedValueOnce(new Error('Private Auth detail'));
    await expect(submitQuietNote('A good wish.', 'token')).rejects.toThrow();
    expect(mocks.invoke).not.toHaveBeenCalled();
    vi.useFakeTimers();
    mocks.rpc.mockReturnValueOnce({ abortSignal: vi.fn().mockReturnValue(new Promise(() => undefined)) });
    const pending = expect(readApprovedNotes()).rejects.toThrow('unavailable');
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });
});
