import { RELIGION_TYPES } from '../../utils/data';
import { isCoordinateOutlier } from '../../utils/geo';

export type DataQualityIssue = {
  code: string;
  organizationId?: string;
  recordIndex: number;
  message: string;
};

export type DataQualityReport = {
  total: number;
  errors: DataQualityIssue[];
  warnings: DataQualityIssue[];
  counts: Record<string, number>;
};

export const registrationStatusNotice = {
  zh: '原始資料含有可能涉及登記狀態變更的文字，請以主管機關最新公告為準。',
  en: 'The source record contains wording that may concern a registration-status change. Please consult the responsible authority’s latest notices.',
};

/** A source-text observation, never a determination of current registration status. */
export function getRegistrationStatusObservation(name: unknown): { code: 'registration-status-text'; matchedText: string } | undefined {
  if (typeof name !== 'string') return undefined;
  const annotation = /[（(]([^（）()]{1,120})[）)]/gu;
  for (const match of name.matchAll(annotation)) {
    // Require an explicit annotation, optionally preceded by a date or "already".
    // A name such as 廢止制度研究會 alone is not registration evidence.
    if (/^\s*(?:\d{2,4}[\d年月日./\s-]*)?\s*(?:已|業已|登記)?\s*(?:廢止|撤銷|撤消|解散|改隸|移轉)/u.test(match[1])) {
      return { code: 'registration-status-text', matchedText: match[0] };
    }
  }
  const explicit = name.match(/已(?:經)?(?:廢止|撤銷|撤消|解散|改隸|移轉)|(?:廢止|撤銷|撤消)(?:寺廟|法人)?登記/u);
  return explicit ? { code: 'registration-status-text', matchedText: explicit[0] } : undefined;
}

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const normalize = (value: string) => value.normalize('NFC').trim().replace(/\s+/gu, ' ');
const religions = new Set<string>(RELIGION_TYPES);

/** Read-only assessment of the snapshot; warnings do not change records or statistics. */
export function assessGovernmentData(records: readonly unknown[]): DataQualityReport {
  const report: DataQualityReport = { total: records.length, errors: [], warnings: [], counts: {} };
  const idGroups = new Map<string, number[]>();
  const identityGroups = new Map<string, number[]>();

  const add = (severity: 'errors' | 'warnings', code: string, recordIndex: number, message: string) => {
    const record = records[recordIndex];
    const id = record && typeof record === 'object' && 'id' in record && text(record.id) ? record.id : undefined;
    report[severity].push({ code, organizationId: id, recordIndex, message });
    report.counts[code] = (report.counts[code] ?? 0) + 1;
  };

  records.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      add('errors', 'invalid-record', index, 'Record must be an object.');
      return;
    }
    const record = raw as Record<string, unknown>;
    for (const field of ['name', 'district', 'address'] as const) {
      if (!text(record[field])) add('errors', `missing-${field}`, index, `Required ${field} is missing or empty.`);
    }
    if (!text(record.id)) add('errors', 'missing-id', index, 'Generated organization ID is missing or empty.');
    else {
      const key = normalize(record.id);
      idGroups.set(key, [...(idGroups.get(key) ?? []), index]);
    }
    if (text(record.name) && text(record.address)) {
      const key = JSON.stringify([normalize(record.name), normalize(record.address)]);
      identityGroups.set(key, [...(identityGroups.get(key) ?? []), index]);
    }

    const latitude = record.latitude;
    const longitude = record.longitude;
    const coordinatesValid = typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
      && typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
    if (!coordinatesValid) add('errors', 'invalid-coordinates', index, 'Latitude and longitude must be finite numeric geographic coordinates.');
    else if (isCoordinateOutlier(longitude, latitude) || record.isCoordinateOutlier === true) {
      add('warnings', 'coordinate-outlier', index, 'Coordinates or the conversion flag indicate a possible Taipei-area outlier; investigate the source.');
    }

    if (!text(record.religion) || !religions.has(record.religion)) {
      add('errors', 'invalid-religion', index, 'Religion classification is missing or outside the existing taxonomy.');
    } else if (record.religion === '其他' || record.religion === '未分類') {
      add('warnings', 'ambiguous-religion', index, 'The source uses Other or Uncategorized; this does not establish a more specific tradition.');
    }

    const festivals = record.festivalDates;
    if (festivals !== undefined && (!Array.isArray(festivals) || festivals.some(value => typeof value !== 'string'))) {
      add('errors', 'invalid-festival-dates', index, 'Festival references must be an array of original text strings.');
    }
    if (!Array.isArray(festivals) || !festivals.some(text)) {
      add('warnings', 'missing-festival-information', index, 'No festival-date text is recorded; this does not imply an absence of activities.');
    }
    if (getRegistrationStatusObservation(record.name)) {
      add('warnings', 'registration-status-text', index, 'Source wording may concern a registration-status change; current status requires official verification.');
    }
  });

  for (const indices of idGroups.values()) {
    if (indices.length > 1) for (const index of indices) add('errors', 'duplicate-id', index, 'Generated organization ID is shared by multiple records.');
  }
  for (const indices of identityGroups.values()) {
    if (indices.length > 1) for (const index of indices) add('warnings', 'duplicate-name-address', index, 'The same normalized name and address occur more than once; investigate without automatically merging records.');
  }
  return report;
}
