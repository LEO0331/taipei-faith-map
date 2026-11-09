import { createHash } from 'node:crypto';
import type { ReligiousOrganization } from '../src/types';
import { parseReligiousOrganizationsOds } from './convertReligiousOrganizations';

const datasetId = '86672d20-9c69-4c24-859b-078862c4e699';
const officialOrigin = 'https://data.taipei';
export const GOVERNMENT_DATASET_URL = `${officialOrigin}/dataset/detail?id=${datasetId}`;

const odsType = 'application/vnd.oasis.opendocument.spreadsheet';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const canonicalId = /^org-\d{1,6}-[a-z0-9]{1,16}$/;
const fields = ['name', 'district', 'village', 'address', 'religion', 'coordinates', 'festivalDates'] as const;
type Field = typeof fields[number];
type SemanticRecord = { [K in Field]: string };

type GovernmentDiff = {
  added: string[];
  removed: string[];
  modified: { id: string; fields: Field[]; fingerprint: string }[];
  ambiguous: number;
  baselineCount: number;
  currentCount: number;
};

class GovernmentCheckError extends Error {}

function normalizedText(value: string | undefined): string {
  return (value ?? '').normalize('NFKC').trim().replace(/\s+/gu, ' ').replace(/(\p{Script=Han}) (?=\p{Script=Han})/gu, '$1');
}

function normalizedFestival(value: string): string {
  return normalizedText(value)
    .replace(/\s*([年月日])\s*/g, '$1')
    .replace(/(^|農曆|國曆|公曆|年)\s*0+(\d+)(?=月)/g, '$1$2')
    .replace(/(月)0+(\d+)(?=日)/g, '$1$2')
    .replace(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/, (_, year, month, day) => `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
}

function semantic(record: ReligiousOrganization): SemanticRecord {
  return {
    name: normalizedText(record.name),
    district: normalizedText(record.district),
    village: normalizedText(record.village),
    address: normalizedText(record.address),
    religion: normalizedText(record.religion),
    coordinates: JSON.stringify([record.originalX, record.originalY]),
    festivalDates: JSON.stringify([...new Set(record.festivalDates.flatMap(date => normalizedText(date).split('|')).map(normalizedFestival).filter(Boolean))].sort()),
  };
}

function fingerprint(record: SemanticRecord): string {
  return createHash('sha256').update(JSON.stringify(record)).digest('hex').slice(0, 20);
}

function safeBaselineId(id: string, record: SemanticRecord): string {
  return canonicalId.test(id) ? id : `baseline-${fingerprint(record)}`;
}

function identityAnchors(record: SemanticRecord): string[] {
  return [
    JSON.stringify(['name-religion', record.name, record.religion]),
    JSON.stringify(['name-district', record.name, record.district]),
    JSON.stringify(['name-address', record.name, record.address]),
    JSON.stringify(['location-address', record.coordinates, record.address]),
  ];
}

/** Pair exact rows first, then only mutually unambiguous change candidates. */
export function compareGovernmentRecords(baseline: ReligiousOrganization[], current: ReligiousOrganization[]): GovernmentDiff {
  const previous = baseline.map(row => ({ row: semantic(row), id: row.id })).sort((a, b) => a.id.localeCompare(b.id));
  const latest = current.map(semantic);
  const exact = new Map<string, number[]>();
  latest.forEach((row, index) => {
    const key = JSON.stringify(row);
    const matches = exact.get(key) ?? [];
    matches.push(index);
    exact.set(key, matches);
  });
  const unmatchedCurrent = new Set(latest.keys());
  const unmatchedPrevious = previous.filter(({ row }) => {
    const exactMatch = exact.get(JSON.stringify(row))?.pop();
    if (exactMatch === undefined) return true;
    unmatchedCurrent.delete(exactMatch);
    return false;
  });

  const anchors = new Map<string, number[]>();
  for (const index of unmatchedCurrent) {
    for (const anchor of identityAnchors(latest[index])) {
      const matches = anchors.get(anchor) ?? [];
      matches.push(index);
      anchors.set(anchor, matches);
    }
  }
  const matching = unmatchedPrevious.map(({ row }) => [...new Set(identityAnchors(row).flatMap(anchor => anchors.get(anchor) ?? []))]);
  const reverseCounts = new Map<number, number>();
  for (const indexes of matching) for (const index of indexes) reverseCounts.set(index, (reverseCounts.get(index) ?? 0) + 1);

  const removed: string[] = [];
  const modified: GovernmentDiff['modified'] = [];
  let ambiguous = 0;
  unmatchedPrevious.forEach(({ row, id }, index) => {
    const candidates = matching[index];
    const safeId = safeBaselineId(id, row);
    if (candidates.length === 0) {
      removed.push(safeId);
    } else if (candidates.length === 1 && reverseCounts.get(candidates[0]) === 1) {
      const target = latest[candidates[0]];
      modified.push({ id: safeId, fields: fields.filter(field => row[field] !== target[field]), fingerprint: fingerprint(target) });
      unmatchedCurrent.delete(candidates[0]);
    } else {
      ambiguous++;
    }
  });
  const added = [...unmatchedCurrent].flatMap(index => {
    if (reverseCounts.has(index)) { ambiguous++; return []; }
    return [`source-${fingerprint(latest[index])}`];
  }).sort();
  // Identical added rows have the same semantic hash. Give each a deterministic ordinal.
  const addedCounts = new Map<string, number>();
  return {
    added: added.map(id => {
      const ordinal = (addedCounts.get(id) ?? 0) + 1;
      addedCounts.set(id, ordinal);
      return ordinal === 1 ? id : `${id}-${ordinal}`;
    }),
    removed: removed.sort(),
    modified: modified.sort((a, b) => a.id.localeCompare(b.id)),
    ambiguous,
    baselineCount: baseline.length,
    currentCount: current.length,
  };
}

function allowedOfficialUrl(url: URL, kind: 'landing' | 'spreadsheet'): boolean {
  if (url.origin !== officialOrigin || url.username || url.password || url.hash) return false;
  if (kind === 'landing') return url.href === GOVERNMENT_DATASET_URL;
  if (url.pathname === '/api/frontstage/tpeod/dataset/resource.download') {
    return url.searchParams.size === 1 && uuid.test(url.searchParams.get('rid') ?? '');
  }
  const resource = url.pathname.match(/^\/api\/dataset\/([^/]+)\/resource\/([^/]+)\/download$/);
  return !!resource && resource[1] === datasetId && uuid.test(resource[2]) && !url.search;
}

export function discoverGovernmentResource(html: string): { resourceUrl: string; metadata: { updatedAt?: string } } {
  const matches = new Map<string, { updatedAt?: string }>();
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => cell[1].replace(/<[^>]+>/g, '').trim());
    if (!cells.includes('ODS')) continue;
    const updatedAt = cells.find(cell => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cell));
    for (const link of row[1].matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
      const url = new URL(link[1].replace(/&amp;/g, '&'), GOVERNMENT_DATASET_URL);
      if (allowedOfficialUrl(url, 'spreadsheet')) matches.set(url.href, updatedAt ? { updatedAt } : {});
    }
  }
  if (matches.size !== 1) throw new GovernmentCheckError('The official landing page did not identify one trusted ODS resource.');
  const [resourceUrl, metadata] = [...matches.entries()][0];
  return { resourceUrl, metadata };
}

async function fetchOfficial(input: string, kind: 'landing' | 'spreadsheet', fetcher: typeof fetch): Promise<Buffer> {
  const limit = kind === 'landing' ? 512 * 1024 : 4 * 1024 * 1024;
  const signal = AbortSignal.timeout(8000);
  let url = new URL(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (!allowedOfficialUrl(url, kind)) throw new GovernmentCheckError('Government source redirect left its allowed official path.');
    const response = await fetcher(url, { signal, redirect: 'manual', credentials: 'omit', cache: 'no-store' });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) throw new GovernmentCheckError('Government source returned an incomplete redirect.');
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new GovernmentCheckError(`Government ${kind} unavailable (HTTP ${response.status}).`);
    }
    const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const acceptedType = kind === 'landing' ? type === 'text/html' : type === odsType || type === 'application/octet-stream';
    if (!acceptedType || Number(response.headers.get('content-length')) > limit || !response.body) {
      await response.body?.cancel();
      throw new GovernmentCheckError(`Government ${kind} has an unexpected type or size.`);
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > limit) throw new GovernmentCheckError(`Government ${kind} exceeded its size limit.`);
        chunks.push(value);
      }
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
    return Buffer.concat(chunks);
  }
  throw new GovernmentCheckError('Government source exceeded the redirect limit.');
}

export async function compareCurrentGovernment(baseline: ReligiousOrganization[], fetcher: typeof fetch = fetch) {
  try {
    const html = await fetchOfficial(GOVERNMENT_DATASET_URL, 'landing', fetcher);
    const { resourceUrl, metadata } = discoverGovernmentResource(html.toString('utf8'));
    const ods = await fetchOfficial(resourceUrl, 'spreadsheet', fetcher);
    let parsed: ReturnType<typeof parseReligiousOrganizationsOds>;
    try { parsed = parseReligiousOrganizationsOds(ods); }
    catch { throw new GovernmentCheckError('Government spreadsheet is invalid or does not match the reviewed schema.'); }
    if (!parsed.organizations.length || parsed.skippedRows.length) {
      throw new GovernmentCheckError('Government spreadsheet contains empty or incomplete records. Comparison withheld.');
    }
    return {
      status: 'complete' as const,
      sourceUrl: GOVERNMENT_DATASET_URL,
      resourceUrl,
      metadata,
      ...compareGovernmentRecords(baseline, parsed.organizations),
    };
  } catch (error) {
    if (error instanceof GovernmentCheckError) throw error;
    throw new GovernmentCheckError('Government source retrieval or parsing could not be completed.');
  }
}
