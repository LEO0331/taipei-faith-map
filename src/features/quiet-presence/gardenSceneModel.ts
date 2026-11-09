import type { PresenceState } from './presenceTypes';
export { GARDEN_DEFAULT_SEAT } from './presenceTypes';

export type GardenSeatId = NonNullable<PresenceState['seatId']>;
export const GARDEN_DEFAULT_BENCH: GardenSeatId = 'seat-1';

/** Projected illustration anchors only. No map coordinates are transmitted. */
export const GARDEN_SEATS: { id: GardenSeatId; x: number; y: number; zh: string; en: string; bench: boolean }[] = [
  { id: 'seat-1', x: 29, y: 42, zh: '樹蔭木椅', en: 'Shaded bench', bench: true },
  { id: 'seat-2', x: 43, y: 34, zh: '蕨葉小徑', en: 'Fern path', bench: false },
  { id: 'seat-3', x: 66, y: 46.5, zh: '池畔木椅', en: 'Pondside bench', bench: true },
  { id: 'seat-4', x: 78, y: 63, zh: '水邊石階', en: 'Water steps', bench: false },
  { id: 'seat-5', x: 49, y: 65, zh: '庭心石台', en: 'Garden stone', bench: false },
  { id: 'seat-6', x: 25, y: 63, zh: '花間木椅', en: 'Flower bench', bench: true },
  { id: 'seat-7', x: 45, y: 79, zh: '迎風小徑', en: 'Breezy path', bench: false },
  { id: 'seat-8', x: 61, y: 80, zh: '暖陽木椅', en: 'Sunlit bench', bench: true },
];

export function gardenSeat(id?: GardenSeatId, guestKey = '') {
  if (id) return GARDEN_SEATS.find(seat => seat.id === id) ?? GARDEN_SEATS[4];
  let hash = 0;
  for (const character of guestKey) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return GARDEN_SEATS[hash % GARDEN_SEATS.length];
}
