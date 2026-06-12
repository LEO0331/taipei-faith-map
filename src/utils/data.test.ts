import { describe, expect, it } from 'vitest';
import { filterOrganizations, normalizeReligion, parseFestivalDates } from './data';
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
