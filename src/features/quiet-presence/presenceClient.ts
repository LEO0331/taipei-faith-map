import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getGuestSession, QuietServiceUnavailableError, stopOptionalAuthRefresh } from '../../services/supabaseClient';
import { AVATAR_VARIANTS, GARDEN_DEFAULT_SEAT, parseGesture, QUIET_GARDEN_CHANNEL, reconcilePresence, SEAT_IDS } from './presenceTypes';
import type { GardenGesture, GestureEvent, PresenceState } from './presenceTypes';

export type GardenConnection = { guestKey: string; perform: (gesture: GardenGesture, seatId?: NonNullable<PresenceState['seatId']>) => Promise<boolean>; leave: () => Promise<void> };

const ACTION_INTERVAL_MS = 2000;
const ACTION_ACK_MS = 3000;
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
  let live = true, joined = false, connected = false, lastAction = -Infinity, nonce = 0;
  let peers: PresenceState[] = [];
  const receivedNonces = new Map<string, number>();
  let rejectJoin: ((error: Error) => void) | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  type Action = { gesture: GardenGesture; resolve: (sent: boolean) => void };
  let pendingAction: Action | undefined;
  let actionTimer: ReturnType<typeof setTimeout> | undefined;
  let actionEpoch = 0;
  let sending = false;
  let cancelActiveAction: (() => void) | undefined;

  const cancelActions = () => {
    ++actionEpoch;
    if (actionTimer) clearTimeout(actionTimer);
    actionTimer = undefined;
    pendingAction?.resolve(false); pendingAction = undefined;
    desiredOwn = own;
    cancelActiveAction?.();
  };
  const scheduleAction = () => {
    if (!live || !connected || sending || !pendingAction || actionTimer) return;
    const delay = Math.max(0, ACTION_INTERVAL_MS - (Date.now() - lastAction));
    if (delay) {
      actionTimer = setTimeout(() => { actionTimer = undefined; void sendAction(); }, delay);
    } else void sendAction();
  };
  const sendAction = async () => {
    if (!live || !connected || sending || !pendingAction || signal?.aborted) return;
    const action = pendingAction; pendingAction = undefined;
    const epoch = actionEpoch;
    sending = true; lastAction = Date.now();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let cancel: () => void = () => undefined;
    const cancelled = new Promise<boolean>(resolve => { cancel = () => resolve(false); });
    cancelActiveAction = cancel;
    const next = desiredOwn;
    // A wave must not erase an unsent seat/pose choice. Synchronize that pose
    // first, then use the next throttled slot for the broadcast itself.
    const poseBeforeWave = action.gesture === 'wave' && (own.gesture !== next.gesture || own.seatId !== next.seatId);
    try {
      const operation = action.gesture === 'wave' && !poseBeforeWave
        ? channel.send({ type: 'broadcast', event: 'gesture', payload: { guestKey, gesture: 'wave', nonce: nonce++ } }, { timeout: ACTION_ACK_MS })
        : channel.track(next, { timeout: ACTION_ACK_MS });
      const accepted = await Promise.race([
        Promise.resolve(operation).then(result => result === 'ok', () => false),
        cancelled,
        new Promise<boolean>(resolve => { deadline = setTimeout(() => resolve(false), ACTION_ACK_MS); }),
      ]);
      const current = live && connected && epoch === actionEpoch && !signal?.aborted;
      if (accepted && current && (action.gesture !== 'wave' || poseBeforeWave)) own = next;
      if (accepted && current && poseBeforeWave && !pendingAction) pendingAction = action;
      else action.resolve(accepted && current && !poseBeforeWave);
    } catch { action.resolve(false); }
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
    await releaseChannel(client, channel);
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
      channel.subscribe(async status => {
        if (!live) return;
        if (status === 'SUBSCRIBED') {
          try {
            if (await channel.track(own) !== 'ok') throw new QuietServiceUnavailableError();
            if (!live) return;
            joined = true; connected = true; if (timeout) clearTimeout(timeout); rejectJoin = undefined;
            onStatus?.('connected'); resolve();
          } catch { onStatus?.('unavailable'); void leave(); }
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
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
    // Keep the most recent intent during a burst, without flooding Realtime.
    // The caller can discard a superseded result using its local action sequence.
    pendingAction?.resolve(false);
    return new Promise<boolean>(resolve => {
      pendingAction = { gesture, resolve };
      scheduleAction();
    });
  } };
}

async function releaseChannel(client: SupabaseClient, channel: RealtimeChannel) {
  // Start untracking and leaving together; do not wait for a lost socket's ACK
  // before cancelling this visit's retries. Corner uses HTTP, not another WS.
  const cleanup: Promise<unknown>[] = [];
  try { cleanup.push(boundedCleanup(channel.untrack())); } catch { /* Continue teardown. */ }
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
