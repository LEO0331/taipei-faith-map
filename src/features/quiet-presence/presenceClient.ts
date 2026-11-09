import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getGuestSession, QuietServiceUnavailableError, stopOptionalAuthRefresh } from '../../services/supabaseClient';
import { AVATAR_VARIANTS, GARDEN_DEFAULT_SEAT, parseGesture, QUIET_GARDEN_CHANNEL, reconcilePresence, SEAT_IDS } from './presenceTypes';
import type { GardenGesture, GestureEvent, PresenceState } from './presenceTypes';

export type GardenConnection = { guestKey: string; perform: (gesture: GardenGesture, seatId?: NonNullable<PresenceState['seatId']>) => Promise<boolean>; leave: () => Promise<void> };

const ACTION_INTERVAL_MS = 2000;
const ACTION_ACK_MS = 3000;
// Supabase documents five track/untrack operations per connection in 30 seconds.
// Keep four slots for tracking, reserve one for departure, and pad the window.
const PRESENCE_WINDOW_MS = 31_000;
const TRACK_SLOTS = 4;
const PRESENCE_SLOTS = 5;
// Keep history across reconnects and visits that reuse this page's client.
const presenceAttempts = new WeakMap<SupabaseClient, number[]>();

function presenceDelay(client: SupabaseClient, limit: number): number {
  const now = performance.now();
  const recent = (presenceAttempts.get(client) ?? []).filter(time => now - time < PRESENCE_WINDOW_MS);
  presenceAttempts.set(client, recent);
  return recent.length < limit ? 0 : Math.ceil(recent[recent.length - limit] + PRESENCE_WINDOW_MS - now);
}

function countPresenceAttempt(client: SupabaseClient) {
  presenceAttempts.get(client)!.push(performance.now());
}

type Options = { captchaToken?: string; onCaptchaConsumed?: () => void; signal?: AbortSignal; onPeers: (peers: PresenceState[]) => void; onGesture?: (event: GestureEvent) => void; onStatus?: (status: 'connected' | 'reconnecting' | 'unavailable') => void };

/** One authorized neutral topic, occasional state changes, no location/history fields. */
export async function joinQuietGarden({ captchaToken, onCaptchaConsumed, signal, onPeers, onGesture, onStatus }: Options): Promise<GardenConnection> {
  const client = await getGuestSession({ captchaToken, onCaptchaConsumed });
  if (signal?.aborted) throw new QuietServiceUnavailableError();
  const { data, error } = await client.auth.getSession();
  if (error || !data.session || data.session.user.is_anonymous !== true || signal?.aborted) throw new QuietServiceUnavailableError();
  await client.realtime.setAuth(data.session.access_token);
  if (signal?.aborted) throw new QuietServiceUnavailableError();
  const guestKey = crypto.randomUUID();
  let own: PresenceState = { guestKey, avatarVariant: AVATAR_VARIANTS[parseInt(guestKey.slice(0, 2), 16) % AVATAR_VARIANTS.length], gesture: 'idle', seatId: GARDEN_DEFAULT_SEAT };
  let desiredOwn = own;
  const channel = client.channel(QUIET_GARDEN_CHANNEL, { config: { private: true, presence: { key: guestKey }, broadcast: { ack: true, self: false } } });
  let live = true, joined = false, connected = false, lastPose = -Infinity, lastWave = -Infinity, nonce = 0;
  let poseConfirmed = false;
  let peers: PresenceState[] = [];
  const receivedNonces = new Map<string, number>();
  let rejectJoin: ((error: Error) => void) | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  type ResolveAction = (sent: boolean) => void;
  let pendingPose: ResolveAction | undefined;
  let pendingWave: ResolveAction | undefined;
  let actionTimer: ReturnType<typeof setTimeout> | undefined;
  let registrationTimer: ReturnType<typeof setTimeout> | undefined;
  let registering = false;
  let actionEpoch = 0;
  let sending = false;
  let cancelActiveAction: (() => void) | undefined;

  const cancelActions = () => {
    ++actionEpoch;
    if (actionTimer) clearTimeout(actionTimer);
    actionTimer = undefined;
    if (registrationTimer) clearTimeout(registrationTimer);
    registrationTimer = undefined;
    registering = false;
    pendingPose?.(false); pendingPose = undefined;
    pendingWave?.(false); pendingWave = undefined;
    desiredOwn = own;
    cancelActiveAction?.();
  };
  const scheduleAction = () => {
    if (actionTimer) clearTimeout(actionTimer);
    actionTimer = undefined;
    if (!live || !connected || sending) return;
    if (pendingPose && poseConfirmed && own.gesture === desiredOwn.gesture && own.seatId === desiredOwn.seatId) {
      pendingPose(true); pendingPose = undefined;
    }
    const now = performance.now();
    const poseDelay = pendingPose ? Math.max(presenceDelay(client, TRACK_SLOTS), ACTION_INTERVAL_MS - (now - lastPose)) : Infinity;
    const waveDelay = pendingWave ? Math.max(0, ACTION_INTERVAL_MS - (now - lastWave)) : Infinity;
    const delay = Math.min(poseDelay, waveDelay);
    if (!Number.isFinite(delay)) return;
    if (delay) {
      actionTimer = setTimeout(scheduleAction, delay);
    } else void sendAction(waveDelay < poseDelay);
  };
  const sendAction = async (wave: boolean) => {
    const resolveAction = wave ? pendingWave : pendingPose;
    if (!resolveAction) return;
    if (wave) pendingWave = undefined;
    else pendingPose = undefined;
    const epoch = actionEpoch;
    sending = true;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let cancel: () => void = () => undefined;
    const cancelled = new Promise<boolean>(resolve => { cancel = () => resolve(false); });
    cancelActiveAction = cancel;
    const next = desiredOwn;
    try {
      if (wave) lastWave = performance.now();
      else {
        lastPose = performance.now();
        poseConfirmed = false;
        countPresenceAttempt(client);
      }
      const operation = wave
        ? channel.send({ type: 'broadcast', event: 'gesture', payload: { guestKey, gesture: 'wave', nonce: nonce++ } }, { timeout: ACTION_ACK_MS })
        : channel.track(next, { timeout: ACTION_ACK_MS });
      const accepted = await Promise.race([
        Promise.resolve(operation).then(result => result === 'ok', () => false),
        cancelled,
        new Promise<boolean>(resolve => { deadline = setTimeout(() => resolve(false), ACTION_ACK_MS); }),
      ]);
      const current = live && connected && epoch === actionEpoch && !signal?.aborted;
      if (accepted && current && !wave) { own = next; poseConfirmed = true; }
      resolveAction(accepted && current);
    } catch { resolveAction(false); }
    finally {
      if (deadline) clearTimeout(deadline);
      if (cancelActiveAction === cancel) cancelActiveAction = undefined;
      sending = false;
      scheduleAction();
    }
  };

  const leave = async () => {
    if (!live) return;
    live = false;
    cancelActions();
    if (timeout) clearTimeout(timeout);
    signal?.removeEventListener('abort', aborted);
    rejectJoin?.(new QuietServiceUnavailableError()); rejectJoin = undefined;
    onPeers([]);
    const canUntrack = joined && presenceDelay(client, PRESENCE_SLOTS) === 0;
    if (canUntrack) countPresenceAttempt(client);
    await releaseChannel(client, channel, canUntrack);
  };
  const aborted = () => { void leave(); };
  signal?.addEventListener('abort', aborted, { once: true });
  channel.on('presence', { event: 'sync' }, () => {
    if (!live) return;
    peers = reconcilePresence(channel.presenceState(), guestKey);
    const currentKeys = new Set(peers.map(peer => peer.guestKey));
    for (const key of receivedNonces.keys()) if (!currentKeys.has(key)) receivedNonces.delete(key);
    onPeers(peers);
  }).on('broadcast', { event: 'gesture' }, ({ payload }) => {
    const event = parseGesture(payload);
    if (!live || !event || !peers.some(peer => peer.guestKey === event.guestKey) || event.nonce <= (receivedNonces.get(event.guestKey) ?? -1)) return;
    receivedNonces.set(event.guestKey, event.nonce); onGesture?.(event);
  });

  try {
    await new Promise<void>((resolve, reject) => {
      rejectJoin = reject;
      timeout = setTimeout(() => { onStatus?.('unavailable'); void leave(); }, 10_000);
      const register = async (epoch: number) => {
        if (!live || epoch !== actionEpoch) return;
        const delay = presenceDelay(client, TRACK_SLOTS);
        if (delay) {
          registrationTimer = setTimeout(() => void register(epoch), delay);
          return;
        }
        countPresenceAttempt(client);
        try {
          if (await channel.track(own, { timeout: ACTION_ACK_MS }) !== 'ok') throw new QuietServiceUnavailableError();
          if (!live || epoch !== actionEpoch) return;
          registering = false; poseConfirmed = true; joined = true; connected = true;
          if (timeout) clearTimeout(timeout);
          rejectJoin = undefined;
          onStatus?.('connected'); resolve();
        } catch {
          if (live && epoch === actionEpoch) { onStatus?.('unavailable'); void leave(); }
        }
      };
      channel.subscribe(status => {
        if (!live) return;
        if (status === 'SUBSCRIBED') {
          if (connected || registering) return;
          registering = true;
          const delay = presenceDelay(client, TRACK_SLOTS);
          if (delay) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => { onStatus?.('unavailable'); void leave(); }, delay + ACTION_ACK_MS + 1000);
          }
          void register(actionEpoch);
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          if (joined && !connected && !registering) return;
          connected = false;
          cancelActions();
          if (!joined) { onStatus?.('unavailable'); void leave(); }
          else {
            peers = []; onPeers([]); onStatus?.('reconnecting');
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => { onStatus?.('unavailable'); void leave(); }, 10_000);
          }
        }
      });
    });
  } catch { await leave(); throw new QuietServiceUnavailableError(); }

  return { guestKey, leave, perform: (gesture, seatId) => {
    if (!live || !connected || signal?.aborted || !['idle', 'wave', 'sit'].includes(gesture)
      || (seatId !== undefined && !SEAT_IDS.includes(seatId))) return Promise.resolve(false);
    if (gesture !== 'wave') {
      desiredOwn = { ...desiredOwn, gesture, seatId: seatId ?? desiredOwn.seatId };
    }
    return new Promise<boolean>(resolve => {
      if (gesture === 'wave') { pendingWave?.(false); pendingWave = resolve; }
      else { pendingPose?.(false); pendingPose = resolve; }
      scheduleAction();
    });
  } };
}

async function releaseChannel(client: SupabaseClient, channel: RealtimeChannel, canUntrack: boolean) {
  // Start untracking and leaving together; do not wait for a lost socket's ACK
  // before cancelling this visit's retries. Corner uses HTTP, not another WS.
  const cleanup: Promise<unknown>[] = [];
  if (canUntrack) {
    try { cleanup.push(boundedCleanup(channel.untrack())); } catch { /* Continue teardown. */ }
  }
  try { cleanup.push(boundedCleanup(channel.unsubscribe(500))); } catch { /* Continue teardown. */ }
  client.realtime.disconnect();
  stopOptionalAuthRefresh(client);
  await Promise.allSettled(cleanup);
  try { await boundedCleanup(client.removeChannel(channel)); } catch { /* Already disconnected. */ }
}

async function boundedCleanup(operation: Promise<unknown>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { await Promise.race([operation, new Promise(resolve => { timer = setTimeout(resolve, 500); })]); }
  finally { if (timer) clearTimeout(timer); }
}
