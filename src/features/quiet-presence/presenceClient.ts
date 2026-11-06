import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getGuestSession, QuietServiceUnavailableError, stopOptionalAuthRefresh } from '../../services/supabaseClient';
import { AVATAR_VARIANTS, parseGesture, QUIET_GARDEN_CHANNEL, reconcilePresence } from './presenceTypes';
import type { GardenGesture, GestureEvent, PresenceState } from './presenceTypes';

export type GardenConnection = { guestKey: string; perform: (gesture: GardenGesture) => Promise<boolean>; leave: () => Promise<void> };
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
  let own: PresenceState = { guestKey, avatarVariant: AVATAR_VARIANTS[parseInt(guestKey.slice(0, 2), 16) % AVATAR_VARIANTS.length], gesture: 'idle' };
  const channel = client.channel(QUIET_GARDEN_CHANNEL, { config: { private: true, presence: { key: guestKey }, broadcast: { ack: true, self: false } } });
  let live = true, joined = false, connected = false, lastAction = -Infinity, nonce = 0;
  let peers: PresenceState[] = [];
  const receivedNonces = new Map<string, number>();
  let rejectJoin: ((error: Error) => void) | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const leave = async () => {
    if (!live) return;
    live = false;
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

  return { guestKey, leave, perform: async gesture => {
    if (!live || !connected || signal?.aborted || !['idle', 'wave', 'sit'].includes(gesture) || Date.now() - lastAction < 2000) return false;
    lastAction = Date.now();
    try {
      if (gesture === 'wave') return await channel.send({ type: 'broadcast', event: 'gesture', payload: { guestKey, gesture, nonce: nonce++ } }) === 'ok';
      own = { guestKey, avatarVariant: own.avatarVariant, gesture,
        ...(gesture === 'sit' ? { seatId: `seat-${parseInt(guestKey.slice(0, 2), 16) % 8 + 1}` as PresenceState['seatId'] } : {}) };
      return await channel.track(own) === 'ok';
    } catch { return false; }
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
