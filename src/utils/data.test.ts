import { describe, expect, it } from 'vitest';
import { buildSummary, filterOrganizations, normalizeReligion, parseFestivalDates } from './data';
import type { ReligiousOrganization } from '../types';

const baseItem: ReligiousOrganization = {
  id: 'org-1',
  name: '測試宮',
  district: '大安區',
  village: '龍門里',
  religion: '道教',
  festivalDates: ['農曆3月23日(天上聖母聖誕)'],
  address: '台北市大安區測試路1號',
  originalX: 304000,
  originalY: 2770000,
  longitude: 121.53,
  latitude: 25.02,
  source: '臺北市已立案宗教團體點位資料',
};

describe('data utilities', () => {
  it('parses pipe-separated festival dates and ignores trailing separators', () => {
    expect(parseFestivalDates('農曆每月13日|農曆每月19日|')).toEqual([
      '農曆每月13日',
      '農曆每月19日',
    ]);
  });

  it('normalizes blank religion values to 未分類', () => {
    expect(normalizeReligion('')).toBe('未分類');
    expect(normalizeReligion(undefined)).toBe('未分類');
  });

  it('searches across name, address, district, village, religion, and festival dates', () => {
    const items: ReligiousOrganization[] = [
      baseItem,
      {
        ...baseItem,
        id: 'org-2',
        name: '另一處',
        district: '信義區',
        village: undefined,
        religion: '佛教',
        festivalDates: [],
        address: '台北市信義區松仁路',
      },
    ];

    expect(filterOrganizations(items, emptyFilters('天上聖母'))).toHaveLength(1);
    expect(filterOrganizations(items, emptyFilters('信義區'))).toHaveLength(1);
    expect(filterOrganizations(items, { ...emptyFilters(''), hasFestivalDate: true })).toHaveLength(1);
  });

  it('combines religion, district, village, festival, and case-insensitive search filters', () => {
    const items: ReligiousOrganization[] = [
      baseItem,
      { ...baseItem, id: 'org-2', name: '龍門佛堂', religion: '佛教' },
      { ...baseItem, id: 'org-3', name: '文山宮', district: '文山區', village: '景美里' },
      { ...baseItem, id: 'org-4', name: '無慶典宮', festivalDates: [] },
    ];

    expect(
      filterOrganizations(items, {
        religion: '道教',
        district: '大安區',
        village: '龍門里',
        hasFestivalDate: true,
        search: '測試宮',
      }).map((item) => item.id),
    ).toEqual(['org-1']);

    expect(filterOrganizations(items, { ...emptyFilters('龍門佛堂'), religion: '佛教' }).map((item) => item.id)).toEqual([
      'org-2',
    ]);
    expect(filterOrganizations(items, { ...emptyFilters(''), religion: 'All' })).toHaveLength(items.length);
  });

  it('builds dashboard data from the same filtered records', () => {
    const filteredItems = filterOrganizations(
      [baseItem, { ...baseItem, id: 'org-2', district: '信義區', religion: '佛教', festivalDates: [] }],
      { ...emptyFilters(''), district: '大安區' },
    );

    expect(buildSummary(filteredItems)).toMatchObject({
      total: 1,
      byDistrict: [{ district: '大安區', count: 1 }],
      byReligion: [{ religion: '道教', count: 1 }],
      withFestivalDateCount: 1,
      withoutFestivalDateCount: 0,
    });
  });
});

function emptyFilters(search: string) {
  return {
    religion: '全部' as const,
    district: '',
    village: '',
    hasFestivalDate: false,
    search,
  };
}
