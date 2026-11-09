export const QUIET_GARDEN_CHANNEL = 'quiet-garden:v1';
export const GARDEN_JOIN_TIMEOUT_MS = 60_000;
export const AVATAR_VARIANTS = ['sage', 'ochre', 'clay'] as const;
export const SEAT_IDS = ['seat-1', 'seat-2', 'seat-3', 'seat-4', 'seat-5', 'seat-6', 'seat-7', 'seat-8'] as const;
export const GARDEN_DEFAULT_SEAT = SEAT_IDS[4];
export type GardenGesture = 'idle' | 'wave' | 'sit';
export type PresenceState = {
  guestKey: string;
  avatarVariant: typeof AVATAR_VARIANTS[number];
  seatId?: typeof SEAT_IDS[number];
  gesture: GardenGesture;
};
export type GestureEvent = { guestKey: string; gesture: GardenGesture; nonce: number };

const guestKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const gestures = new Set(['idle', 'wave', 'sit']);

function boundedObject(value: unknown, keys: string[], maxBytes: number): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) return false;
  try { return new TextEncoder().encode(JSON.stringify(value)).length <= maxBytes; } catch { return false; }
}

/** SDK metadata is allowed only on received presence; arbitrary fields are rejected. */
export function parsePresence(value: unknown): PresenceState | undefined {
  if (!boundedObject(value, ['guestKey', 'avatarVariant', 'seatId', 'gesture', 'presence_ref'], 512)) return undefined;
  if (typeof value.guestKey !== 'string' || !guestKeyPattern.test(value.guestKey)) return undefined;
  if (!AVATAR_VARIANTS.includes(value.avatarVariant as PresenceState['avatarVariant']) || typeof value.gesture !== 'string' || !gestures.has(value.gesture)) return undefined;
  if (value.seatId !== undefined && !SEAT_IDS.includes(value.seatId as PresenceState['seatId'] & string)) return undefined;
  if (value.presence_ref !== undefined && (typeof value.presence_ref !== 'string' || value.presence_ref.length > 128)) return undefined;
  return { guestKey: value.guestKey, avatarVariant: value.avatarVariant as PresenceState['avatarVariant'], gesture: value.gesture as GardenGesture,
    ...(value.seatId ? { seatId: value.seatId as PresenceState['seatId'] } : {}) };
}

export function parseGesture(value: unknown): GestureEvent | undefined {
  if (!boundedObject(value, ['guestKey', 'gesture', 'nonce'], 256)) return undefined;
  if (typeof value.guestKey !== 'string' || !guestKeyPattern.test(value.guestKey) || typeof value.gesture !== 'string' || !gestures.has(value.gesture)) return undefined;
  if (!Number.isSafeInteger(value.nonce) || Number(value.nonce) < 0) return undefined;
  return { guestKey: value.guestKey, gesture: value.gesture as GardenGesture, nonce: Number(value.nonce) };
}

/** Require matching ephemeral channel/payload keys; these are not verified identities. */
export function reconcilePresence(raw: unknown, ownKey: string): PresenceState[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const unique = new Map<string, PresenceState>();
  for (const [channelKey, values] of Object.entries(raw).slice(0, 100)) {
    if (!Array.isArray(values)) continue;
    for (const value of values.slice(0, 5)) {
      const peer = parsePresence(value);
      if (peer && peer.guestKey === channelKey && peer.guestKey !== ownKey) unique.set(peer.guestKey, peer);
      if (unique.size >= 50) return [...unique.values()];
    }
  }
  return [...unique.values()].sort((a, b) => a.guestKey.localeCompare(b.guestKey));
}
