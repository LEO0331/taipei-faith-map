import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import organizationsJson from '../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../types';
import type { ConfirmedCulturalEvent } from '../features/religious-calendar/calendarTypes';
import { getRelatedCulturalItems } from './relatedContent';

const mockedEvents = vi.hoisted(() => [] as ConfirmedCulturalEvent[]);
vi.mock('../features/religious-calendar/culturalEvents', () => ({ culturalEvents: mockedEvents }));
const organizations = organizationsJson as ReligiousOrganization[];
const place = (id: string) => organizations.find(organization => organization.id === id)!;
const today = '2026-11-05';

beforeEach(async () => {
  const actual = await vi.importActual<{ culturalEvents: ConfirmedCulturalEvent[] }>('../features/religious-calendar/culturalEvents');
  mockedEvents.splice(0, mockedEvents.length, ...structuredClone(actual.culturalEvents));
});
afterEach(() => mockedEvents.splice(0));

describe('explicit related cultural relationships', () => {
  it('connects the four newly profiled route places only through reviewed existing references', () => {
    const qingshan = getRelatedCulturalItems(place('org-21-1bs6r0m'), organizations, today);
    expect(qingshan.map(item => item.target.kind)).toEqual(['milestone', 'milestone', 'story', 'route', 'event']);
    expect(qingshan.every(item => item.target.organizationId === 'org-21-1bs6r0m')).toBe(true);
    const qingshui = getRelatedCulturalItems(place('org-294-ypjbe6'), organizations, today);
    expect(qingshui.map(item => item.target.kind)).toEqual(['milestone', 'story', 'route']);
    for (const id of ['org-109-1vaoeq', 'org-335-mdesof']) {
      const items = getRelatedCulturalItems(place(id), organizations, today);
      expect(items.map(item => item.target.kind)).toEqual(['route']);
      expect(items[0].target.id).toBe('dadaocheng-faith-and-community');
    }
  });

  it('does not infer connections from religion, proximity or a similar place name', () => {
    expect(getRelatedCulturalItems(place('org-1-mtb4vg'), organizations, today)).toEqual([]);
    const qingshan = place('org-21-1bs6r0m');
    for (const changed of [{ ...qingshan, id: 'different' }, { ...qingshan, name: `${qingshan.name}分堂` }, { ...qingshan, district: '大同區' }, { ...qingshan, address: `${qingshan.address}2樓` }]) {
      expect(getRelatedCulturalItems(changed, organizations, today)).toEqual([]);
    }
    expect(getRelatedCulturalItems(qingshan, [...organizations, qingshan], today)).toEqual([]);
    expect(getRelatedCulturalItems(qingshan, [...organizations, { ...qingshan, id: 'duplicate-identity' }], today)).toEqual([]);
  });

  it('withholds relationships whose curated identity becomes stale even if the requested subject matches the changed record', () => {
    const original = place('org-21-1bs6r0m');
    const changed = { ...original, address: '另一個地址' };
    const records = organizations.map(organization => organization.id === changed.id ? changed : organization);
    expect(getRelatedCulturalItems(changed, records, today)).toEqual([]);
  });

  it('links only future or ongoing confirmed events and includes dated source-check context', () => {
    const qingshan = place('org-21-1bs6r0m');
    const event = getRelatedCulturalItems(qingshan, organizations, today).find(item => item.target.kind === 'event')!;
    expect(event.detail?.en).toContain('November 28, 2026');
    expect(event.detail?.zh).toContain('2026-11-04');
    expect(event.detail?.en).toContain('latest notice');
    expect(getRelatedCulturalItems(qingshan, organizations, '2026-11-30').some(item => item.target.kind === 'event')).toBe(true);
    expect(getRelatedCulturalItems(qingshan, organizations, '2026-12-01').some(item => item.target.kind === 'event')).toBe(false);
    expect(getRelatedCulturalItems(qingshan, organizations, 'invalid-date').some(item => item.target.kind === 'event')).toBe(false);
  });

  it.each(['cancelled', 'postponed'] as const)('does not present %s notices as upcoming related events', status => {
    mockedEvents[0].status = status;
    expect(getRelatedCulturalItems(place('org-21-1bs6r0m'), organizations, today).some(item => item.target.kind === 'event')).toBe(false);
  });

  it('withholds unreviewed or unsafe event references', () => {
    mockedEvents[0].editorialReviewStatus = 'pending';
    expect(getRelatedCulturalItems(place('org-21-1bs6r0m'), organizations, today).some(item => item.target.kind === 'event')).toBe(false);
    mockedEvents[0].editorialReviewStatus = 'internal-reviewed';
    mockedEvents[0].sources[0].url = 'javascript:alert(1)';
    expect(getRelatedCulturalItems(place('org-21-1bs6r0m'), organizations, today).some(item => item.target.kind === 'event')).toBe(false);
  });
});
