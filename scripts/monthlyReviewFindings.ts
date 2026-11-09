import { createHash } from 'node:crypto';
import type { ContentAuditReport } from '../src/features/content-quality/auditTypes';
import type { SourceReachability } from '../src/features/content-quality/sourceReachability';
import type { ConfirmedCulturalEvent } from '../src/features/religious-calendar/calendarTypes';
import { sourceAgeDays } from '../src/features/content-quality/contentAudit';
import { getSafeSourceUrl } from '../src/features/faith-spaces/culturalSources';
import { isValidDateOnly } from '../src/utils/curatedContent';

export type Group = 'government' | 'editorial' | 'source' | 'calendar';
export type Finding = {
  id: string;
  fingerprint: string;
  group: Group;
  scope: string;
  code: string;
  severity: 'attention' | 'review' | 'inconclusive';
  link?: string;
  httpStatus?: number;
};
export type PriorFinding = Pick<Finding, 'id' | 'fingerprint' | 'group' | 'scope'>;
export type FindingStatus = 'new' | 'baseline-known' | 'previously-unresolved' | 'no-longer-observed' | 'inconclusive';

export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function safeIdentifier(value: string): string {
  return /^[\p{L}\p{N}_./-]{1,160}$/u.test(value) ? value : `ref-${digest(value).slice(0, 16)}`;
}
export function publicSourceUrl(value: string): string | undefined {
  const safe = getSafeSourceUrl(value);
  if (!safe) return undefined;
  const url = new URL(safe);
  if (url.port || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname)
    || !/[a-z]$/i.test(url.hostname) || /\.(?:local|localhost|internal|test|example)$/i.test(url.hostname)
    || [...url.searchParams.keys()].some(key => /token|secret|password|api.?key|auth|session/i.test(key))) return undefined;
  url.hash = '';
  return url.href;
}

export function finding(group: Group, scope: string, code: string, severity: Finding['severity'], evidence: unknown = code, link?: string): Finding {
  const id = digest([group, scope, code]).slice(0, 24);
  return { id, fingerprint: digest([id, evidence]).slice(0, 24), group, scope: safeIdentifier(scope), code: safeIdentifier(code), severity, ...(link ? { link } : {}) };
}

export function auditFindings(report: ContentAuditReport): Finding[] {
  return [
    ...report.errors.map(item => finding('editorial', `${item.scope}/${digest(item.message).slice(0, 12)}`, item.code, 'attention', item.message)),
    ...report.warnings.map(item => finding('editorial', item.scope, item.code, 'review', item.code, publicSourceUrl(item.scope))),
    ...report.government.errors.map(item => finding('editorial', item.organizationId ?? `record-${item.recordIndex + 1}`, item.code, 'attention', item.message)),
    ...report.government.warnings.map(item => finding('editorial', item.organizationId ?? `record-${item.recordIndex + 1}`, item.code, 'review')),
  ];
}

export const sourceScope = (url: string) => `source-${digest(url).slice(0, 20)}`;

export function linkFindings(results: SourceReachability[]) {
  const findings: Finding[] = [];
  const uncertain = new Set<string>();
  for (const result of results) {
    const scope = sourceScope(result.url);
    const link = publicSourceUrl(result.url);
    if (result.status === 'reachable') continue;
    const add = (item: Finding) => {
      if (Number.isInteger(result.httpStatus) && result.httpStatus! >= 100 && result.httpStatus! <= 599) item.httpStatus = result.httpStatus;
      findings.push(item);
    };
    if (result.httpStatus === 404 || result.httpStatus === 410) {
      add(finding('source', scope, 'http-missing', 'review', result.httpStatus, link));
    } else if (result.status === 'redirected' && result.redirectTarget && publicSourceUrl(result.redirectTarget)) {
      // A changed destination is a review lead. The redirect target was never requested.
      add(finding('source', scope, 'redirect-observed', 'review', [result.httpStatus, result.redirectTarget], link));
      uncertain.add(scope);
    } else {
      add(finding('source', scope, `http-${result.status}`, 'inconclusive', result.httpStatus, link));
      uncertain.add(scope);
    }
  }
  return { findings, uncertain };
}

export function eventFindings(events: ConfirmedCulturalEvent[], asOf: string, links: SourceReachability[]) {
  return events.flatMap(event => {
    if (event.status !== 'confirmed' || event.editorialReviewStatus === 'pending'
      || !isValidDateOnly(event.startDate) || !isValidDateOnly(event.endDate)) return [];
    const scope = `events/${event.id}`;
    const link = publicSourceUrl(event.sources?.[0]?.url ?? '');
    const until = sourceAgeDays(asOf, event.startDate)!;
    const phase = event.endDate < asOf ? 'completed' : event.startDate <= asOf ? 'ongoing' : 'upcoming';
    const findings: Finding[] = [];
    if (phase !== 'upcoming' || until <= 30) findings.push(finding('calendar', scope, `event-${phase}`, 'review', [event.startDate, event.endDate], link));
    const stale = [event.verifiedAt, ...(event.sources ?? []).map(source => source.verifiedAt)]
      .some(date => { const age = sourceAgeDays(date, asOf); return age === null || age > 30; });
    if (phase !== 'completed' && stale) findings.push(finding('calendar', scope, 'event-review-window', 'review', [event.verifiedAt, event.startDate], link));
    if (event.sources?.some(source => links.some(item => item.url === publicSourceUrl(source.url) && item.status !== 'reachable'))) {
      findings.push(finding('calendar', scope, 'organizer-source-unverified', 'inconclusive', 'unverified', link));
    }
    return [{ id: safeIdentifier(event.id), start: event.startDate, end: event.endDate, phase, stale, findings }];
  });
}

export function classifyFindings(current: Finding[], baseline: ReadonlySet<string>, prior: PriorFinding[], uncertain: (item: PriorFinding) => boolean) {
  const previous = new Map(prior.map(item => [item.id, item]));
  const deduplicated = new Map(current.map(item => [item.id, item]));
  const findings = [...deduplicated.values()].map(item => {
    let status: FindingStatus = 'new';
    if (item.severity === 'inconclusive') status = 'inconclusive';
    else if (baseline.has(item.fingerprint)) status = 'baseline-known';
    else if (previous.get(item.id)?.fingerprint === item.fingerprint) status = 'previously-unresolved';
    return { ...item, status };
  });
  const tracked = findings.filter(item => item.status === 'new' || item.status === 'previously-unresolved').map(toPrior);
  const resolved: PriorFinding[] = [];
  const carried: PriorFinding[] = [];
  for (const item of prior) {
    if (tracked.some(active => active.id === item.id)) continue;
    if (uncertain(item)) { carried.push(item); tracked.push(item); }
    else resolved.push(item);
  }
  return { findings, tracked, resolved, carried };
}

function toPrior({ id, fingerprint, group, scope }: Finding): PriorFinding {
  return { id, fingerprint, group, scope };
}
