import { describe, expect, it } from 'vitest';
import { parseGesture, parsePresence, reconcilePresence } from '../presenceTypes';

const key = 'c6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1';
const own = 'd6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1';
const peer = { guestKey: key, avatarVariant: 'sage', gesture: 'idle' };

describe('neutral presence payloads', () => {
  it('accepts only minimal neutral state and removes SDK-only metadata', () => {
    expect(parsePresence({ ...peer, seatId: 'seat-3', presence_ref: 'transport-ref' })).toEqual({ ...peer, seatId: 'seat-3' });
    expect(parseGesture({ guestKey: key, gesture: 'wave', nonce: 2 })).toEqual({ guestKey: key, gesture: 'wave', nonce: 2 });
  });

  it.each(['organizationId', 'religion', 'latitude', 'longitude', 'userId', 'email', 'readingHistory'])('rejects forbidden visitor information: %s', field => {
    expect(parsePresence({ ...peer, [field]: 'unwanted' })).toBeUndefined();
    expect(parseGesture({ guestKey: key, gesture: 'wave', nonce: 1, [field]: 'unwanted' })).toBeUndefined();
  });

  it('rejects malformed, oversized and unknown state instead of drawing invented visitors', () => {
    expect(parsePresence({ ...peer, guestKey: 'auth-user' })).toBeUndefined();
    expect(parsePresence({ ...peer, avatarVariant: 'unknown' })).toBeUndefined();
    expect(parsePresence({ ...peer, gesture: 'prayer' })).toBeUndefined();
    expect(parsePresence({ ...peer, seatId: 'seat-999' })).toBeUndefined();
    expect(parsePresence({ ...peer, presence_ref: 'x'.repeat(600) })).toBeUndefined();
    expect(parseGesture({ guestKey: key, gesture: 'wave', nonce: -1 })).toBeUndefined();
    expect(parseGesture({ guestKey: key, gesture: 'wave', nonce: Infinity })).toBeUndefined();
    expect(parseGesture({ guestKey: key, gesture: 'wave', nonce: 1.5 })).toBeUndefined();
    expect(reconcilePresence(undefined, own)).toEqual([]);
  });

  it('reconciles the server snapshot by temporary key, excluding self and duplicate reconnect entries', () => {
    expect(reconcilePresence({ [key]: [peer, { ...peer, gesture: 'sit' }], [own]: [{ ...peer, guestKey: own }], bad: [{ ...peer, religion: 'unwanted' }] }, own))
      .toEqual([{ ...peer, gesture: 'sit' }]);
  });

  it('bounds the number of displayed connected peers', () => {
    const state = Object.fromEntries(Array.from({ length: 70 }, (_, index) => {
      const guestKey = `${index.toString(16).padStart(8, '0')}-c5bc-4f8b-b3d4-7ebc2738a7c1`;
      return [guestKey, [{ ...peer, guestKey }]];
    }));
    expect(reconcilePresence(state, own)).toHaveLength(50);
  });

  it('rejects a payload claiming a different presence key', () => {
    expect(reconcilePresence({ [own]: [peer] }, own)).toEqual([]);
  });
});
