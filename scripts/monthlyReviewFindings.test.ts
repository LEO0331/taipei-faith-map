import { describe, expect, it } from 'vitest';
import { collectCuratedAuditData } from '../src/features/content-quality/contentAudit';
import { metadataComparison, monitoringStatus } from './monthlyContentReview';
import { classifyFindings, eventFindings, finding, linkFindings, publicSourceUrl, safeIdentifier } from './monthlyReviewFindings';

describe('monthly review evidence', () => {
  it('cannot report unchanged content after an incomplete check', () => {
    expect(monitoringStatus(true, 0, false)).toBe('Monitoring incomplete');
    expect(monitoringStatus(false, 1, false)).toBe('Attention required');
    expect(monitoringStatus(false, 0, true)).toBe('Review recommended');
    expect(monitoringStatus(false, 0, false)).toBe('No material change detected');
  });
  it('distinguishes metadata-only changes from changes to records', () => {
    expect(metadataComparison('2021-04-29', '2026-11-09', 0)).toMatchObject({ changed: true, metadataOnly: true });
    expect(metadataComparison('2021-04-29', '2026-11-09', 1)).toMatchObject({ changed: true, metadataOnly: false });
    expect(metadataComparison(undefined, '2026-11-09', 0)).toMatchObject({ changed: false, metadataOnly: false });
    expect(metadataComparison(undefined, 'private contact metadata', 0).current).toBeUndefined();
  });

  it('classifies historical warnings without issuing them as new findings', () => {
    const known = finding('editorial', 'org-12-abc', 'festival-date-missing', 'review');
    const changed = finding('government', 'org-12-abc', 'field-address', 'review', 'normalized-digest');
    const report = classifyFindings([known, changed, changed], new Set([known.fingerprint]), [], () => false);
    expect(report.findings.map(item => item.status)).toEqual(['baseline-known', 'new']);
    expect(report.tracked.map(item => item.id)).toEqual([changed.id]);
    const next = classifyFindings([known, changed], new Set([known.fingerprint]), report.tracked, () => false);
    expect(next.findings.map(item => item.status)).toEqual(['baseline-known', 'previously-unresolved']);
  });

  it('holds unresolved findings when a previously missing source returns 403', () => {
    const url = 'https://www.travel.taipei/file/34731/';
    const missing = linkFindings([{ url, status: 'unavailable', httpStatus: 404 }]);
    const first = classifyFindings(missing.findings, new Set(), [], () => false);
    const blocked = linkFindings([{ url, status: 'blocked', httpStatus: 403 }]);
    const next = classifyFindings(blocked.findings, new Set(), first.tracked, item => blocked.uncertain.has(item.scope));
    expect(next.findings[0].status).toBe('inconclusive');
    expect(next.tracked).toEqual(first.tracked);
    expect(next.resolved).toEqual([]);
    const reachable = linkFindings([{ url, status: 'reachable', httpStatus: 200 }]);
    expect(classifyFindings(reachable.findings, new Set(), next.tracked, () => false).resolved).toEqual(first.tracked);
  });

  it('uses the same finding ID and a new fingerprint for meaningfully changed evidence', () => {
    const before = finding('government', 'org-12-abc', 'field-address', 'review', 'first');
    const after = finding('government', 'org-12-abc', 'field-address', 'review', 'second');
    expect(after.id).toBe(before.id);
    expect(after.fingerprint).not.toBe(before.fingerprint);
    expect(classifyFindings([after], new Set(), [before], () => false).findings[0].status).toBe('new');
  });

  it('records the announced event phase and review-window expiry without generating another occurrence', () => {
    const events = collectCuratedAuditData().events;
    const [upcoming] = eventFindings(events, '2026-11-09', []);
    expect(upcoming).toMatchObject({ phase: 'upcoming', stale: false });
    expect(upcoming.findings.map(item => item.code)).toContain('event-upcoming');
    const [expired] = eventFindings(events, '2026-12-08', []);
    expect(expired).toMatchObject({ phase: 'completed', stale: true });
    expect(expired.findings.map(item => item.code)).toEqual(['event-completed']);
    const [stale] = eventFindings(events.map(event => ({ ...event, endDate: '2027-01-10' })), '2026-12-08', []);
    expect(stale.findings.map(item => item.code)).toContain('event-review-window');
  });

  it('redacts raw evidence, credentials and private or unsafe destinations', () => {
    const item = finding('editorial', 'raw name: contact@example.test', 'invalid', 'attention', 'phone 0912345678');
    expect(JSON.stringify(item)).not.toMatch(/contact@|0912345678/);
    expect(safeIdentifier('routes/bangka')).toBe('routes/bangka');
    for (const url of ['https://user:password@place.gov.tw/', 'https://place.gov.tw/?api_key=private', 'http://127.0.0.1/', 'http://local.internal/']) {
      expect(publicSourceUrl(url)).toBeUndefined();
    }
    expect(publicSourceUrl('https://data.taipei/dataset/detail?id=public-record')).toContain('id=public-record');
  });
});
