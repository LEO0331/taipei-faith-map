import type { ReligiousOrganization } from '../../types';
import { isValidDateOnly } from '../../utils/curatedContent';
import { placeProfiles } from '../faith-spaces/placeProfiles';
import { traditionContent } from '../faith-spaces/traditionContent';
import { validatePlaceProfiles, validateTraditionContent } from '../faith-spaces/placeProfileLookup';
import { getSafeSourceUrl } from '../faith-spaces/culturalSources';
import { culturalEvents } from '../religious-calendar/culturalEvents';
import { getTaipeiToday } from '../religious-calendar/calendarUtils';
import { validateCulturalEvents } from '../religious-calendar/calendarValidation';
import { culturalRoutes } from '../cultural-routes/culturalRoutes';
import { validateCulturalRoutes } from '../cultural-routes/routeValidation';
import { historicalMilestones } from '../heritage/historicalMilestones';
import { heritageStories } from '../heritage/heritageStories';
import { heritageOrganizations } from '../heritage/heritageOrganizations';
import { validateHeritageContent } from '../heritage/heritageValidation';
import type { SourceReference } from '../faith-spaces/placeProfileTypes';
import { assessGovernmentData } from './dataQuality';
import { getContentCoverage } from './contentCoverage';
import type { AuditIssue, ContentAuditReport, CuratedAuditData, SourceOccurrence } from './auditTypes';

export function collectCuratedAuditData(): CuratedAuditData {
  return { profiles: placeProfiles, traditions: traditionContent, events: culturalEvents, routes: culturalRoutes,
    milestones: historicalMilestones, stories: heritageStories, places: heritageOrganizations };
}

/** Preserve claim locations; identical shared references are counted without calling them errors. */
export function collectSourceOccurrences(data: CuratedAuditData): SourceOccurrence[] {
  const output: SourceOccurrence[] = [];
  const add = (scope: string, sources: SourceReference[]) => {
    if (Array.isArray(sources)) for (const source of sources) if (source && typeof source === 'object') output.push({ scope, source });
  };
  for (const profile of data.profiles) {
    add(`profiles/${profile.id}/introduction`, profile.sources);
    for (const fact of profile.facts ?? []) add(`profiles/${profile.id}/facts/${fact.id}`, fact.sources);
  }
  for (const tradition of data.traditions) {
    add(`traditions/${tradition.religion}/introduction`, tradition.sources);
    for (const concept of tradition.concepts ?? []) add(`traditions/${tradition.religion}/concepts/${concept.id}`, concept.sources);
  }
  for (const event of data.events) add(`events/${event.id}`, event.sources);
  for (const route of data.routes) for (const stop of route.stops ?? []) add(`routes/${route.id}/${stop.organizationId}`, stop.sourceReferences);
  for (const milestone of data.milestones) add(`milestones/${milestone.id}`, milestone.sources);
  for (const story of data.stories) {
    add(`stories/${story.id}/introduction`, story.sources);
    for (const chapter of story.chapters ?? []) add(`stories/${story.id}/chapters/${chapter.id}`, chapter.sources);
  }
  for (const place of data.places) add(`places/${place.organizationId}`, place.sources);
  return output;
}

export function sourceAgeDays(verifiedAt: string, asOf: string): number | null {
  if (!isValidDateOnly(verifiedAt) || !isValidDateOnly(asOf)) return null;
  return Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${verifiedAt}T00:00:00Z`)) / 86_400_000);
}

export function auditCuratedContent(data: CuratedAuditData, organizations: ReligiousOrganization[], asOf = getTaipeiToday()): ContentAuditReport {
  if (!isValidDateOnly(asOf)) throw new Error('Audit date must be a valid YYYY-MM-DD date.');
  const errors: AuditIssue[] = [], warnings: AuditIssue[] = [];
  const validate = (scope: string, callback: () => string[]) => {
    try { for (const message of callback()) errors.push({ code: 'structural-validation', scope, message }); }
    catch { errors.push({ code: 'structural-validation', scope, message: 'Invalid data shape prevented the existing validator from completing.' }); }
  };
  validate('profiles', () => validatePlaceProfiles(data.profiles, organizations));
  validate('traditions', () => validateTraditionContent(data.traditions));
  validate('events', () => validateCulturalEvents(data.events, organizations));
  validate('routes', () => validateCulturalRoutes(data.routes, organizations));
  validate('heritage', () => validateHeritageContent(data, organizations, data.routes.map(route => route.id)));
  const reviewedItems = [
    ...data.profiles.map(item => ({ scope: `profiles/${item.id}`, status: item.editorialReviewStatus, date: item.lastReviewed })),
    ...data.traditions.map(item => ({ scope: `traditions/${item.religion}`, status: item.editorialReviewStatus, date: item.lastReviewed })),
    ...data.events.map(item => ({ scope: `events/${item.id}`, status: item.editorialReviewStatus, date: item.verifiedAt })),
    ...data.routes.map(item => ({ scope: `routes/${item.id}`, status: item.editorialReviewStatus, date: item.lastReviewed })),
    ...data.milestones.map(item => ({ scope: `milestones/${item.id}`, status: item.editorialReviewStatus, date: item.lastReviewed })),
    ...data.stories.map(item => ({ scope: `stories/${item.id}`, status: item.editorialReviewStatus, date: item.lastReviewed })),
  ];
  for (const item of reviewedItems) {
    if (item.status === 'pending') warnings.push({ code: 'pending-review', scope: item.scope, message: 'Pending editorial review; not evidence of publication or institutional approval.' });
    if (item.status === 'community-reviewed') warnings.push({ code: 'community-review-record', scope: item.scope, message: 'Community review is recorded in metadata. Confirm its documented external-review record; this offline audit does not verify that consultation occurred.' });
    const age = sourceAgeDays(item.date, asOf);
    if (age !== null && age < 0) errors.push({ code: 'future-review-date', scope: item.scope, message: `Review date ${item.date} is later than the audit date.` });
  }
  const occurrences = collectSourceOccurrences(data);
  const byId = new Map<string, Set<string>>(), byUrl = new Map<string, SourceOccurrence[]>();
  for (const occurrence of occurrences) {
    const { source, scope } = occurrence;
    const href = getSafeSourceUrl(source.url);
    if (!href) continue; // Existing validators record unsafe URLs as structural errors.
    const destinations = byId.get(source.id) ?? new Set<string>();
    destinations.add(href); byId.set(source.id, destinations);
    const uses = byUrl.get(href) ?? []; uses.push(occurrence); byUrl.set(href, uses);
    if ((sourceAgeDays(source.verifiedAt, asOf) ?? 0) < 0) errors.push({ code: 'future-source-date', scope, message: `Source check ${source.verifiedAt} is later than the audit date.` });
  }
  for (const [id, destinations] of byId) if (destinations.size > 1) errors.push({ code: 'source-id-collision', scope: `sources/${id}`, message: 'One source identifier points to different destinations.' });
  const sourceChecks: ContentAuditReport['sources']['checks'] = [];
  for (const [url, uses] of byUrl) {
    const ids = [...new Set(uses.map(use => use.source.id))];
    if (ids.length > 1) warnings.push({ code: 'duplicate-source-url', scope: url, message: `The same URL has ${ids.length} source identifiers. Review reuse without assuming that shared evidence is invalid.` });
    const records = new Map<string, SourceOccurrence[]>();
    for (const use of uses) {
      const signature = JSON.stringify([use.source.id, use.source.title, use.source.publisher, use.source.verifiedAt]);
      const group = records.get(signature) ?? []; group.push(use); records.set(signature, group);
    }
    for (const group of records.values()) {
      const source = group[0].source;
      const age = sourceAgeDays(source.verifiedAt, asOf);
      sourceChecks.push({ url, verifiedAt: source.verifiedAt, ageDays: age, scopes: [...new Set(group.map(use => use.scope))] });
      if (age !== null && age > 365) warnings.push({ code: 'source-review-age', scope: url, message: `Source metadata was checked ${age} days ago. Investigate when reviewing; age alone does not make the historical claim false.` });
    }
    for (const id of ids) {
      const signatures = new Set(uses.filter(use => use.source.id === id).map(use => JSON.stringify([use.source.title, use.source.publisher, use.source.verifiedAt])));
      if (signatures.size > 1) warnings.push({ code: 'source-record-drift', scope: `sources/${id}`, message: 'Copies of the same source record differ in title, publisher or check date; reconcile editorial metadata.' });
    }
  }
  const timeSensitiveEvents = data.events.filter(event => event.status === 'confirmed' && event.endDate >= asOf).map(event => {
    const ages = [sourceAgeDays(event.verifiedAt, asOf), ...(event.sources ?? []).map(source => sourceAgeDays(source.verifiedAt, asOf))];
    const knownAges = ages.filter((age): age is number => age !== null);
    const ageDays = knownAges.length ? Math.max(...knownAges) : null;
    const needsReverification = ageDays === null || ageDays > 30;
    if (needsReverification) warnings.push({ code: 'event-reverification', scope: `events/${event.id}`, message: 'Upcoming or ongoing event has an older or incomplete source check. Reverify dates and participation; do not infer new arrangements.' });
    return { id: event.id, startDate: event.startDate, endDate: event.endDate, verifiedAt: event.verifiedAt, ageDays, needsReverification };
  });
  return {
    asOf, policy: { eventReviewDays: 30, referenceReviewDays: 365 },
    counts: { profiles: data.profiles.length, traditions: data.traditions.length, events: data.events.length, routes: data.routes.length, milestones: data.milestones.length, stories: data.stories.length, places: data.places.length },
    chapterCount: data.stories.reduce((sum, story) => sum + (story.chapters?.length ?? 0), 0),
    errors, warnings, coverage: getContentCoverage(data.profiles, organizations),
    sources: { referenceUses: occurrences.length, uniqueUrls: byUrl.size, checks: sourceChecks },
    editorial: { pending: reviewedItems.filter(item => item.status === 'pending').length,
      internalReviewed: reviewedItems.filter(item => item.status === 'internal-reviewed').length,
      communityReviewed: reviewedItems.filter(item => item.status === 'community-reviewed').length },
    timeSensitiveEvents, government: assessGovernmentData(organizations),
  };
}

export function formatContentAudit(report: ContentAuditReport): string {
  const lines = [`# Cultural content audit — ${report.asOf}`, '', 'Offline structural checks and editorial priorities. Source age is metadata, not a factual-accuracy verdict. No network reachability or community consultation is implied.', '', '## Coverage', '',
    '| Content type | Items |', '| --- | ---: |', ...Object.entries(report.counts).map(([kind, count]) => `| ${kind} | ${count} |`), `| story chapters | ${report.chapterCount} |`, '',
    `Published, safely matched profiles: ${report.coverage.publishedProfiles}/${report.coverage.totalProfiles}. Source references: ${report.sources.referenceUses} uses of ${report.sources.uniqueUrls} distinct URLs.`, '',
    '| Religion category | Government records | Published profiles |', '| --- | ---: | ---: |', ...report.coverage.byReligion.map(item => `| ${item.religion} | ${item.organizations} | ${item.profiles} |`), '',
    'Coverage counts describe editorial scope, not religious importance, popularity or influence.', '',
    `Recorded editorial statuses: ${report.editorial.internalReviewed} internal-reviewed; ${report.editorial.communityReviewed} community-reviewed; ${report.editorial.pending} pending. These are metadata, not verification that external review occurred or institutional endorsement.`, '',
    '## Structural errors', '', ...issues(report.errors), '', '## Editorial advisories', '', ...issues(report.warnings), '',
    '## Time-sensitive notices', '', ...report.timeSensitiveEvents.map(event => `- ${event.id}: ${event.startDate}–${event.endDate}; checked ${event.verifiedAt}; age ${event.ageDays ?? 'unknown'} days; ${event.needsReverification ? 'REVERIFY' : 'within the 30-day review window'}.`),
    ...(report.timeSensitiveEvents.length ? [] : ['No upcoming or ongoing confirmed notices.']), '',
    '## Government data quality', '', `Records: ${report.government.total}. Structural errors: ${report.government.errors.length}. Investigation candidates: ${report.government.warnings.length}.`, '',
    ...Object.entries(report.government.counts).map(([code, count]) => `- ${code}: ${count}`), '',
    ...report.government.errors.map(issue => `- **${issue.code}** · ${issue.organizationId ?? `record ${issue.recordIndex + 1}`}: ${issue.message}`),
    ...report.government.warnings.filter(issue => ['registration-status-text', 'duplicate-name-address', 'coordinate-outlier'].includes(issue.code)).map(issue => `- Investigate **${issue.code}** · ${issue.organizationId ?? `record ${issue.recordIndex + 1}`}: ${issue.message}`), '',
    'Government findings are observations of the snapshot; records and Dashboard totals are not modified. Status-change wording is a verification candidate, not a current-status determination.', '',
    '## Source-check ages', '', '| URL | Checked | Age (days) | Claim locations |', '| --- | --- | ---: | ---: |',
    ...report.sources.checks.map(source => `| ${source.url.replace(/\|/g, '%7C')} | ${source.verifiedAt} | ${source.ageDays ?? 'invalid'} | ${source.scopes.length} |`), '',
    'Reference-age advisory threshold: 365 days. Event re-verification threshold: 30 days. These are review priorities, not automatic changes to published facts.',
  ];
  return lines.join('\n');
}

function issues(items: AuditIssue[]): string[] {
  return items.length ? items.map(item => `- **${item.code}** · ${item.scope}: ${item.message}`) : ['None.'];
}
