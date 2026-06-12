import type { Filters, ReligionType, ReligiousOrganization, ReligiousSummary } from '../types';

export const SOURCE_NAME = '臺北市已立案宗教團體點位資料';

export const RELIGION_TYPES: ReligionType[] = [
  '道教',
  '佛教',
  '基督教',
  '天主教',
  '一貫道',
  '回教',
  '天德教',
  '軒轅教',
  '理教',
  '巴哈伊教',
  '天理教',
  '其他',
  '未分類',
];

const RELIGION_SET = new Set<string>(RELIGION_TYPES);

export function normalizeEmpty(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeReligion(raw: string | undefined): ReligionType {
  const normalized = normalizeEmpty(raw);
  if (!normalized) return '未分類';
  return RELIGION_SET.has(normalized) ? (normalized as ReligionType) : '其他';
}

export function parseFestivalDates(raw: string | undefined): string[] {
  const normalized = normalizeEmpty(raw);
  if (!normalized) return [];

  return normalized
    .split('|')
    .map((date) => date.trim())
    .filter(Boolean);
}

export function createStableId(parts: Array<string | number | undefined>, index: number): string {
  const basis = [...parts, index + 1].filter((part) => part !== undefined).join('|');
  let hash = 5381;

  for (let i = 0; i < basis.length; i += 1) {
    hash = (hash * 33) ^ basis.charCodeAt(i);
  }

  return `org-${index + 1}-${(hash >>> 0).toString(36)}`;
}

export function filterOrganizations(
  items: ReligiousOrganization[],
  filters: Filters,
): ReligiousOrganization[] {
  const search = filters.search.trim().toLocaleLowerCase('zh-Hant');
  const isAllReligion = filters.religion === '全部' || filters.religion === 'All';

  return items.filter((item) => {
    if (!isAllReligion && item.religion !== filters.religion) return false;
    if (filters.district && item.district !== filters.district) return false;
    if (filters.village && item.village !== filters.village) return false;
    if (filters.hasFestivalDate && item.festivalDates.length === 0) return false;

    if (!search) return true;

    const haystack = [
      item.name,
      item.religion,
      item.district,
      item.village,
      item.address,
      ...item.festivalDates,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-Hant');

    return haystack.includes(search);
  });
}

export function buildSummary(items: ReligiousOrganization[]): ReligiousSummary {
  const byReligion = countBy(items, (item) => item.religion).map(([religion, count]) => ({
    religion,
    count,
  }));
  const byDistrict = countBy(items, (item) => item.district).map(([district, count]) => ({
    district,
    count,
  }));
  const withFestivalDateCount = items.filter((item) => item.festivalDates.length > 0).length;

  return {
    total: items.length,
    byReligion,
    byDistrict,
    withFestivalDateCount,
    withoutFestivalDateCount: items.length - withFestivalDateCount,
  };
}

function countBy(
  items: ReligiousOrganization[],
  selector: (item: ReligiousOrganization) => string,
): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = selector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([keyA, countA], [keyB, countB]) => countB - countA || keyA.localeCompare(keyB, 'zh-Hant'));
}
