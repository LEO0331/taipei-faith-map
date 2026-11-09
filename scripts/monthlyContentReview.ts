import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ReligiousOrganization } from '../src/types';
import { auditCuratedContent, collectCuratedAuditData, collectSourceOccurrences } from '../src/features/content-quality/contentAudit';
import { auditSourceReachability } from '../src/features/content-quality/sourceReachability';
import { getTaipeiToday } from '../src/features/religious-calendar/calendarUtils';
import { isValidDateOnly } from '../src/utils/curatedContent';
import { compareCurrentGovernment, GOVERNMENT_DATASET_URL } from './monthlyGovernment';
import { auditFindings, classifyFindings, digest, eventFindings, finding, linkFindings, publicSourceUrl, safeIdentifier } from './monthlyReviewFindings';
import type { Finding, Group, PriorFinding } from './monthlyReviewFindings';

const canonicalPath = 'public/data/religious-organizations.json';
const baselinePath = 'scripts/monthly-content-baseline.json';
const sha = /^[a-f0-9]{40}$/;
const signature = /^[a-f0-9]{24}$/;
type Baseline = {
  asOf: string;
  datasetCommit: string;
  curatedCommit: string;
  datasetDigest: string;
  curatedDigest: string;
  sourceInventoryDigest: string;
  governmentUpdatedAt?: string;
};
type PriorState = { tracked: PriorFinding[]; available: boolean };

async function loadCanonical() {
  const records = JSON.parse(await readFile(canonicalPath, 'utf8')) as ReligiousOrganization[];
  const curated = collectCuratedAuditData();
  const sources = collectSourceOccurrences(curated).map(({ scope, source }) => [scope, source.id, source.url, source.verifiedAt, source.publisher, source.title]);
  const urls = [...new Set(sources.map(item => item[2] as string))];
  return { records, curated, urls, datasetDigest: digest(records), curatedDigest: digest(curated), sourceInventoryDigest: digest(sources) };
}

function timestamp(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const date = value.slice(0, 10);
  if (!isValidDateOnly(date) || !/^\d{4}-\d\d-\d\d(?:[ T]\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:?\d\d)?)?$/.test(value)) return undefined;
  return value;
}

export async function writeBaseline(asOf: string, datasetCommit: string, curatedCommit: string, governmentUpdatedAt?: string) {
  if (!isValidDateOnly(asOf) || !sha.test(datasetCommit) || !sha.test(curatedCommit)
    || (governmentUpdatedAt && !timestamp(governmentUpdatedAt))) throw new Error('Baseline requires a date, full reviewed commit IDs and an optional published update timestamp.');
  const { datasetDigest, curatedDigest, sourceInventoryDigest } = await loadCanonical();
  const baseline: Baseline = { asOf, datasetCommit, curatedCommit, datasetDigest, curatedDigest, sourceInventoryDigest, ...(governmentUpdatedAt ? { governmentUpdatedAt } : {}) };
  await writeFile(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
}

const groups = new Set<Group>(['government', 'editorial', 'source', 'calendar']);
async function readPrior(filename?: string): Promise<PriorState> {
  if (!filename) return { tracked: [], available: true };
  try {
    const value = JSON.parse(await readFile(filename, 'utf8')) as Partial<PriorState>;
    if (value.available !== true || !Array.isArray(value.tracked) || value.tracked.length > 5000) return { tracked: [], available: false };
    const tracked = value.tracked.filter(item => item && signature.test(item.id) && signature.test(item.fingerprint)
      && groups.has(item.group) && typeof item.scope === 'string' && safeIdentifier(item.scope) === item.scope)
      .map(({ id, fingerprint, group, scope }) => ({ id, fingerprint, group, scope }));
    return { tracked, available: tracked.length === value.tracked.length };
  } catch { return { tracked: [], available: false }; }
}

export function metadataComparison(previous: string | undefined, current: unknown, recordChanges: number) {
  const currentTimestamp = timestamp(current);
  const previousTimestamp = timestamp(previous);
  const changed = !!currentTimestamp && !!previousTimestamp && currentTimestamp !== previousTimestamp;
  return { previous: previousTimestamp, current: currentTimestamp, changed, metadataOnly: changed && recordChanges === 0 };
}

export function monitoringStatus(incomplete: boolean, structural: number, needsReview: boolean) {
  if (incomplete) return 'Monitoring incomplete';
  if (structural) return 'Attention required';
  return needsReview ? 'Review recommended' : 'No material change detected';
}

async function observe(asOf: string, prior: PriorState) {
  const canonical = await loadCanonical();
  const baseline = JSON.parse(await readFile(baselinePath, 'utf8')) as Baseline;
  const audit = auditCuratedContent(canonical.curated, canonical.records, asOf);
  const baselineMatches = isValidDateOnly(baseline.asOf) && baseline.asOf <= asOf
    && sha.test(baseline.datasetCommit) && sha.test(baseline.curatedCommit)
    && baseline.datasetDigest === canonical.datasetDigest && baseline.curatedDigest === canonical.curatedDigest
    && baseline.sourceInventoryDigest === canonical.sourceInventoryDigest;
  const accepted = baselineMatches ? new Set(auditFindings(auditCuratedContent(canonical.curated, canonical.records, baseline.asOf))
    .filter(item => item.severity === 'review').map(item => item.fingerprint)) : new Set<string>();
  const urls = [...new Set(canonical.urls.map(publicSourceUrl).filter((url): url is string => !!url))];
  const [government, sourceResults] = baselineMatches ? await Promise.all([
    compareCurrentGovernment(canonical.records).catch(() => undefined),
    auditSourceReachability(urls, { timeoutMs: 5000, concurrency: 4 }).catch(() => undefined),
  ]) : [undefined, undefined];
  const source = linkFindings(sourceResults ?? []);
  const events = eventFindings(canonical.curated.events, asOf, sourceResults ?? []);
  const changes: Finding[] = [];
  if (government) {
    for (const id of government.added) changes.push(finding('government', id, 'record-added', 'review', id, GOVERNMENT_DATASET_URL));
    for (const id of government.removed) changes.push(finding('government', id, 'record-missing', 'review', id, GOVERNMENT_DATASET_URL));
    for (const item of government.modified) for (const field of item.fields) {
      changes.push(finding('government', item.id, `field-${field}`, 'review', item.fingerprint ?? item.fields, GOVERNMENT_DATASET_URL));
    }
  }
  const review = classifyFindings([...auditFindings(audit), ...changes, ...source.findings, ...events.flatMap(event => event.findings)], accepted, prior.tracked,
    item => !baselineMatches || (item.group === 'government' && (!government || government.ambiguous > 0))
      || (item.group === 'source' && (!sourceResults || source.uncertain.has(item.scope))));
  const incomplete = !baselineMatches || !prior.available || !government || !sourceResults
    || source.findings.some(item => item.severity === 'inconclusive') || canonical.urls.some(url => !publicSourceUrl(url));
  const structural = audit.errors.length + audit.government.errors.length;
  const status = monitoringStatus(incomplete, structural, !!government?.ambiguous
    || review.findings.some(item => item.status === 'new' || item.status === 'previously-unresolved'));
  return {
    asOf, status, baselineMatches, baseline: {
      asOf: isValidDateOnly(baseline.asOf) ? baseline.asOf : undefined,
      datasetCommit: sha.test(baseline.datasetCommit) ? baseline.datasetCommit : undefined,
      curatedCommit: sha.test(baseline.curatedCommit) ? baseline.curatedCommit : undefined,
    },
    government: {
      source: GOVERNMENT_DATASET_URL, retrieval: government ? 'complete' : 'incomplete',
      ...(government ? {
        added: government.added.length, removed: government.removed.length, modified: government.modified.length,
        ambiguous: government.ambiguous, baselineCount: government.baselineCount, currentCount: government.currentCount,
        metadata: metadataComparison(baseline.governmentUpdatedAt, government.metadata.updatedAt,
          government.added.length + government.removed.length + government.modified.length + government.ambiguous),
      } : {}),
    },
    sources: { references: audit.sources.referenceUses, unique: canonical.urls.length, checked: sourceResults?.length ?? 0, inconclusive: source.findings.filter(item => item.severity === 'inconclusive').length },
    editorial: { counts: audit.counts, structural, pending: audit.editorial.pending },
    events: events.map(({ findings: _findings, ...event }) => event),
    ...review,
    notify: baselineMatches && prior.available && (review.findings.some(item => item.status === 'new' && item.severity !== 'inconclusive') || review.resolved.length > 0),
  };
}

type Report = Awaited<ReturnType<typeof observe>>;
function markdown(report: Report): string {
  const groups = ['new', 'baseline-known', 'previously-unresolved', 'inconclusive'] as const;
  const lines = [
    '# Monthly cultural content review', '', `**${report.status}** · ${report.asOf} Asia/Taipei`, '',
    `Government source: ${report.government.source}`,
    `Retrieval: ${report.government.retrieval}`,
    `Reviewed data commit: ${report.baseline.datasetCommit ?? 'unavailable'}`,
    `Curated snapshot commit: ${report.baseline.curatedCommit ?? 'unavailable'}`,
    `Baseline match: ${report.baselineMatches ? 'yes' : 'review required'}`,
    `Published dataset timestamp: ${report.government.metadata?.current ?? 'unavailable'}`,
    ...(report.government.metadata?.metadataOnly ? ['Only published metadata changed. The compared records were unchanged.'] : []),
    ...(report.government.retrieval === 'complete' ? [
      `Candidate records: ${report.government.added} added, ${report.government.removed} removed, ${report.government.modified} modified, ${report.government.ambiguous} ambiguous.`,
    ] : []),
    `Sources: ${report.sources.checked}/${report.sources.unique} checked, ${report.sources.inconclusive} inconclusive. Structural findings: ${report.editorial.structural}. Pending reviews: ${report.editorial.pending}.`,
    '', '## Calendar', '',
    ...report.events.map(event => `- ${event.id} · ${event.phase} · ${event.start} through ${event.end}${event.stale ? ' · recheck source' : ''}`),
    '', '## Findings', '',
    ...groups.flatMap(status => {
      const matches = report.findings.filter(item => item.status === status);
      return [`### ${status} (${matches.length})`, '', ...matches.slice(0, 30).map(item => `- ${item.id} · ${item.code} · ${item.scope}${item.httpStatus ? ` · HTTP ${item.httpStatus}` : ''}${item.link ? ` · <${item.link}>` : ''}`),
        ...(matches.length > 30 ? ['See the JSON report for the remaining entries.'] : []), ''];
    }),
    `Previously tracked findings no longer observed: ${report.resolved.length}. Held open by inconclusive checks: ${report.carried.length}.`,
    '', '## Manual follow-up', '',
    'Confirm candidate differences against the original published evidence. Check redirect destinations, event announcements and current registration identity before editing.',
    'A failed request leaves that check inconclusive. An absent record is a review candidate. Use an owner-reviewed PR for baseline or content updates.',
  ];
  return lines.join('\n') + '\n';
}

export async function runMonthlyReview(outputDirectory: string, priorFile?: string, asOf = getTaipeiToday()): Promise<number> {
  await mkdir(outputDirectory, { recursive: true });
  let report: Report;
  try { report = await observe(asOf, await readPrior(priorFile)); }
  catch {
    const status = 'Monitoring incomplete';
    await writeFile(join(outputDirectory, 'report.json'), JSON.stringify({ asOf, status, notify: false, reason: 'Baseline or audit could not be read.' }, null, 2) + '\n');
    await writeFile(join(outputDirectory, 'report.md'), '# Monthly cultural content review\n\n**Monitoring incomplete**\n\nReview the tracked baseline and audit inputs.\n');
    console.log(status);
    return 1;
  }
  await writeFile(join(outputDirectory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await writeFile(join(outputDirectory, 'report.md'), markdown(report));
  console.log(report.status);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [operation, first, second, third, fourth] = process.argv.slice(2);
  const task = operation === '--write-baseline' && first && second && third
    ? writeBaseline(first, second, third, fourth).then(() => 0)
    : operation === '--out' && first ? runMonthlyReview(first, second) : Promise.reject(new Error('Invalid monitoring arguments.'));
  task.then(code => { process.exitCode = code; }).catch(() => {
    console.error('Monthly review could not write its output. Check the workspace and arguments.');
    process.exitCode = 1;
  });
}
