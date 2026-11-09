// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { joinQuietGarden } from '../presenceClient';
import { getGuestSession } from '../../../services/supabaseClient';

const key = 'c6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1';
const peer = { guestKey: key, avatarVariant: 'sage', gesture: 'idle' };
const state = vi.hoisted(() => ({ status: undefined as unknown as (status: string) => void, presence: {} as Record<string, unknown>, handlers: new Map<string, (event?: unknown) => void>() }));
const channel = vi.hoisted(() => ({
  on: vi.fn((type: string, filter: { event: string }, callback: (event?: unknown) => void) => { state.handlers.set(`${type}:${filter.event}`, callback); return channel; }),
  subscribe: vi.fn((callback: (status: string) => void) => { state.status = callback; return channel; }),
  track: vi.fn(async (_payload: unknown) => 'ok'), untrack: vi.fn(async () => 'ok'), unsubscribe: vi.fn(async () => 'ok'),
  send: vi.fn(async () => 'ok'), presenceState: vi.fn(() => state.presence),
}));
const client = vi.hoisted(() => ({
  auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'private-auth-jwt', user: { is_anonymous: true } } }, error: null })), stopAutoRefresh: vi.fn() },
  realtime: { setAuth: vi.fn(async () => undefined), disconnect: vi.fn() },
  channel: vi.fn(() => channel), removeChannel: vi.fn(async () => 'ok'),
}));
vi.mock('../../../services/supabaseClient', () => ({ getGuestSession: vi.fn(), QuietServiceUnavailableError: class extends Error {}, stopOptionalAuthRefresh: (value: typeof client) => value.auth.stopAutoRefresh() }));
const flush = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };

beforeEach(() => {
  vi.clearAllMocks(); state.handlers.clear(); state.presence = {};
  channel.track.mockReset().mockResolvedValue('ok'); channel.send.mockReset().mockResolvedValue('ok');
  vi.mocked(getGuestSession).mockResolvedValue(client as never);
});
afterEach(() => vi.useRealTimers());

async function connected(options: Parameters<typeof joinQuietGarden>[0]) {
  const pending = joinQuietGarden(options); await flush(); state.status('SUBSCRIBED'); return pending;
}

describe('private quiet garden transport', () => {
  it('uses one authorized neutral topic with a random temporary key and minimal data', async () => {
    const connection = await connected({ captchaToken: 'proof', onPeers: vi.fn() });
    expect(client.channel).toHaveBeenCalledWith('quiet-garden:v1', expect.objectContaining({ config: expect.objectContaining({ private: true, presence: { key: connection.guestKey } }) }));
    expect(client.realtime.setAuth).toHaveBeenCalledWith('private-auth-jwt');
    const payload = channel.track.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(['avatarVariant', 'gesture', 'guestKey', 'seatId']);
    expect(payload.seatId).toBe('seat-5');
    expect(JSON.stringify(payload)).not.toMatch(/private-auth|religion|organization|latitude|longitude/);
    await connection.leave();
  });

  it('reconciles only genuinely received peers and rejects malformed or replayed broadcasts', async () => {
    const onPeers = vi.fn(), onGesture = vi.fn();
    const connection = await connected({ onPeers, onGesture });
    state.presence = { [key]: [peer, peer], [connection.guestKey]: [{ ...peer, guestKey: connection.guestKey }] };
    state.handlers.get('presence:sync')!();
    expect(onPeers).toHaveBeenLastCalledWith([peer]);
    state.handlers.get('broadcast:gesture')!({ payload: { guestKey: key, gesture: 'wave', nonce: 1, religion: 'forbidden' } });
    expect(onGesture).not.toHaveBeenCalled();
    state.handlers.get('broadcast:gesture')!({ payload: { guestKey: key, gesture: 'wave', nonce: 1 } });
    state.handlers.get('broadcast:gesture')!({ payload: { guestKey: key, gesture: 'wave', nonce: 1 } });
    expect(onGesture).toHaveBeenCalledOnce();
    await connection.leave();
  });

  it('coalesces rapid actions into the latest choice while retaining the send interval', async () => {
    vi.useFakeTimers(); vi.setSystemTime(0);
    const connection = await connected({ onPeers: vi.fn() });
    expect(await connection.perform('wave')).toBe(true);
    const superseded = connection.perform('wave');
    const latest = connection.perform('sit', 'seat-3');
    expect(await superseded).toBe(false);
    await vi.advanceTimersByTimeAsync(1999);
    expect(channel.track).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1); expect(await latest).toBe(true);
    expect(channel.send).toHaveBeenCalledExactlyOnceWith({ type: 'broadcast', event: 'gesture', payload: { guestKey: connection.guestKey, gesture: 'wave', nonce: 0 } }, { timeout: 3000 });
    expect(channel.track).toHaveBeenLastCalledWith(expect.objectContaining({ gesture: 'sit', seatId: 'seat-3' }), { timeout: 3000 });
    await connection.leave(); expect(await connection.perform('wave')).toBe(false);
  });

  it('retains the selected seat when resting, and rejects seats outside the neutral whitelist', async () => {
    vi.useFakeTimers(); vi.setSystemTime(0);
    const connection = await connected({ onPeers: vi.fn() });
    expect(await connection.perform('sit', 'seat-7')).toBe(true);
    expect(await connection.perform('sit', 'unknown-seat' as never)).toBe(false);
    const resting = connection.perform('idle');
    await vi.advanceTimersByTimeAsync(2000); expect(await resting).toBe(true);
    const payload = channel.track.mock.calls.at(-1)![0] as Record<string, unknown>;
    expect(payload).toEqual(expect.objectContaining({ gesture: 'idle', seatId: 'seat-7' }));
    expect(Object.keys(payload).sort()).toEqual(['avatarVariant', 'gesture', 'guestKey', 'seatId']);
    await connection.leave();
  });

  it('does not lose a queued seat change when a wave follows immediately', async () => {
    vi.useFakeTimers(); vi.setSystemTime(0);
    const connection = await connected({ onPeers: vi.fn() });
    expect(await connection.perform('wave')).toBe(true);
    const seat = connection.perform('sit', 'seat-4');
    const wave = connection.perform('wave');
    expect(await seat).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    expect(channel.track).toHaveBeenLastCalledWith(expect.objectContaining({ gesture: 'sit', seatId: 'seat-4' }), { timeout: 3000 });
    expect(channel.send).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(2000); expect(await wave).toBe(true);
    expect(channel.send).toHaveBeenCalledTimes(2);
    await connection.leave();
  });

  it('bounds action ACKs, does not run parallel sends, and ignores late failed-seat acknowledgements', async () => {
    vi.useFakeTimers(); vi.setSystemTime(0);
    const connection = await connected({ onPeers: vi.fn() });
    let resolveTrack!: (value: string) => void;
    channel.track.mockImplementationOnce(() => new Promise(resolve => { resolveTrack = resolve; }));
    const first = connection.perform('sit', 'seat-2');
    const latest = connection.perform('idle', 'seat-6');
    await vi.advanceTimersByTimeAsync(2999);
    expect(channel.track).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(await first).toBe(false); expect(await latest).toBe(true);
    resolveTrack('ok'); await flush();
    state.status('CHANNEL_ERROR'); state.status('SUBSCRIBED'); await flush();
    expect(channel.track).toHaveBeenLastCalledWith(expect.objectContaining({ gesture: 'idle', seatId: 'seat-6' }));
    await connection.leave(); expect(vi.getTimerCount()).toBe(0);
  });

  it('settles queued and active actions and prevents delayed sends when leaving', async () => {
    vi.useFakeTimers(); vi.setSystemTime(0);
    const connection = await connected({ onPeers: vi.fn() });
    channel.send.mockImplementationOnce(() => new Promise(() => undefined));
    const active = connection.perform('wave');
    const queued = connection.perform('sit', 'seat-1');
    await connection.leave();
    expect(await active).toBe(false); expect(await queued).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    expect(channel.send).toHaveBeenCalledOnce(); expect(channel.track).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears queued actions on disconnect instead of replaying them on reconnect', async () => {
    vi.useFakeTimers(); vi.setSystemTime(0);
    const connection = await connected({ onPeers: vi.fn() });
    expect(await connection.perform('wave')).toBe(true);
    const queued = connection.perform('sit', 'seat-8');
    state.status('CHANNEL_ERROR'); expect(await queued).toBe(false);
    state.status('SUBSCRIBED'); await flush();
    await vi.advanceTimersByTimeAsync(2500);
    expect(channel.track).toHaveBeenCalledTimes(2);
    expect(channel.track).toHaveBeenLastCalledWith(expect.objectContaining({ gesture: 'idle' }));
    expect((channel.track.mock.calls.at(-1)![0] as Record<string, unknown>).seatId).toBe('seat-5');
    await connection.leave();
  });

  it('untracks, unsubscribes and disconnects once on leave, ignoring late sync events', async () => {
    const onPeers = vi.fn(); const connection = await connected({ onPeers });
    await connection.leave(); await connection.leave();
    expect(channel.untrack).toHaveBeenCalledOnce(); expect(channel.unsubscribe).toHaveBeenCalledOnce();
    expect(client.removeChannel).toHaveBeenCalledOnce(); expect(client.realtime.disconnect).toHaveBeenCalledOnce();
    onPeers.mockClear(); state.handlers.get('presence:sync')!(); expect(onPeers).not.toHaveBeenCalled();
  });

  it('reuses its temporary key on reconnect and does not duplicate avatar rows', async () => {
    const onPeers = vi.fn(); const connection = await connected({ onPeers });
    state.status('CHANNEL_ERROR'); expect(await connection.perform('wave')).toBe(false);
    state.status('SUBSCRIBED'); await flush();
    expect(channel.track).toHaveBeenLastCalledWith(expect.objectContaining({ guestKey: connection.guestKey }));
    expect(client.channel).toHaveBeenCalledOnce();
    await connection.leave();
  });

  it('cancels an opt-in abandoned before authentication completes without creating a channel', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(joinQuietGarden({ signal: controller.signal, onPeers: vi.fn() })).rejects.toThrow();
    expect(client.channel).not.toHaveBeenCalled();
  });

  it('fails within the connection deadline and tears down reconnect attempts', async () => {
    vi.useFakeTimers();
    const pending = joinQuietGarden({ onPeers: vi.fn() });
    const outcome = expect(pending).rejects.toThrow(); await flush();
    await vi.advanceTimersByTimeAsync(10_001); await outcome;
    expect(channel.unsubscribe).toHaveBeenCalledOnce(); expect(client.realtime.disconnect).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
