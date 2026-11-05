import { describe, expect, it } from 'vitest';
import organizationsJson from '../../../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../../../types';
import type { CuratedAuditData } from '../auditTypes';
import { auditCuratedContent, collectCuratedAuditData, collectSourceOccurrences, formatContentAudit, sourceAgeDays } from '../contentAudit';

const organizations = organizationsJson as ReligiousOrganization[];
const organization = organizations[0];
const source = { id: 'source', title: { zh: '機構史料', en: 'Institution history' }, url: 'https://example.org/history', publisher: 'Example institution', verifiedAt: '2026-11-01' };
function fixture(): CuratedAuditData {
  return {
    profiles: [{ id: 'fixture-profile', organizationId: organization.id, organizationName: organization.name, district: organization.district, address: organization.address,
      introduction: { zh: '有來源的場所介紹。', en: 'A sourced introduction.' }, sources: [source],
      facts: [{ id: 'fact', title: { zh: '建築', en: 'Building' }, description: { zh: '史料記載的建築。', en: 'A documented building.' }, sources: [source] }],
      lastReviewed: '2026-11-01', editorialReviewStatus: 'internal-reviewed' }],
    traditions: [], events: [], routes: [], milestones: [], stories: [], places: [],
  };
}

describe('offline cultural content audit', () => {
  it('audits every real curated collection using existing validators and records no invented community review', () => {
    const data = collectCuratedAuditData();
    const before = JSON.stringify(data);
    const report = auditCuratedContent(data, organizations, '2026-11-05');
    expect(report.errors).toEqual([]);
    expect(report.counts.profiles).toBe(data.profiles.length);
    expect(report.counts.stories).toBe(data.stories.length);
    expect(report.chapterCount).toBe(data.stories.reduce((sum, story) => sum + story.chapters.length, 0));
    expect(report.sources.referenceUses).toBe(collectSourceOccurrences(data).length);
    expect(report.sources.uniqueUrls).toBeGreaterThan(0);
    expect(report.editorial.communityReviewed).toBe(0);
    expect(JSON.stringify(data)).toBe(before);
    expect(report.government.total).toBe(organizations.length);
  });

  it('separates missing evidence, duplicate identifiers and broken identities from editorial warnings', () => {
    const data = fixture();
    data.profiles[0].sources = [];
    data.profiles.push(structuredClone(data.profiles[0]));
    const report = auditCuratedContent(data, [{ ...organization, address: 'Changed address' }], '2026-11-05');
    const messages = report.errors.map(issue => issue.message).join(' ');
    expect(messages).toContain('source references');
    expect(messages).toContain('duplicate profile identifier');
    expect(messages).toContain('mismatched organization');
    expect(report.coverage.publishedProfiles).toBe(0);
  });

  it('reports malformed and future review dates as errors, not freshness advisories', () => {
    const data = fixture();
    data.profiles[0].lastReviewed = '2026-02-30';
    data.profiles[0].facts[0].sources = [{ ...source, verifiedAt: '2027-01-01' }];
    const report = auditCuratedContent(data, [organization], '2026-11-05');
    expect(report.errors.some(issue => issue.message.includes('lastReviewed'))).toBe(true);
    expect(report.errors.some(issue => issue.code === 'future-source-date')).toBe(true);
    expect(() => auditCuratedContent(data, [organization], 'not-a-date')).toThrow('Audit date');
  });

  it('keeps old historical/reference metadata advisory without declaring claims false', () => {
    const report = auditCuratedContent(fixture(), [organization], '2028-01-01');
    expect(report.errors).toEqual([]);
    expect(report.warnings.some(issue => issue.code === 'source-review-age')).toBe(true);
    expect(report.coverage.publishedProfiles).toBe(1);
    expect(formatContentAudit(report)).toContain('age alone does not make the historical claim false');
  });

  it('flags upcoming notices for renewed verification using the oldest linked check, not a fresh parent date alone', () => {
    const data = fixture();
    data.events.push({ id: 'upcoming', organizationId: organization.id, organizationName: organization.name, district: organization.district, address: organization.address,
      title: { zh: '測試活動', en: 'Test occurrence' }, description: { zh: '測試公告。', en: 'A test notice.' }, location: { zh: '測試場所', en: 'Test location' },
      startDate: '2028-01-02', endDate: '2028-01-03', timeZone: 'Asia/Taipei', attendance: 'unknown', status: 'confirmed',
      sources: [source], verifiedAt: '2028-01-01', editorialReviewStatus: 'internal-reviewed' });
    const report = auditCuratedContent(data, [organization], '2028-01-01');
    expect(report.errors).toEqual([]);
    expect(report.timeSensitiveEvents[0].needsReverification).toBe(true);
    expect(report.warnings.some(issue => issue.code === 'event-reverification')).toBe(true);
    data.events[0].status = 'cancelled';
    expect(auditCuratedContent(data, [organization], '2028-01-01').timeSensitiveEvents).toEqual([]);
  });

  it('reports pending work honestly without counting it as published or community-reviewed', () => {
    const data = fixture();
    data.profiles[0].editorialReviewStatus = 'pending';
    const report = auditCuratedContent(data, [organization], '2026-11-05');
    expect(report.errors).toEqual([]);
    expect(report.warnings.some(issue => issue.code === 'pending-review')).toBe(true);
    expect(report.coverage.publishedProfiles).toBe(0);
    expect(report.editorial.pending).toBe(1);
    expect(report.editorial.communityReviewed).toBe(0);
    data.profiles[0].editorialReviewStatus = 'community-reviewed';
    const recorded = auditCuratedContent(data, [organization], '2026-11-05');
    expect(recorded.warnings.some(issue => issue.code === 'community-review-record')).toBe(true);
    expect(formatContentAudit(recorded)).toContain('not verification that external review occurred');
  });

  it('accepts shared reference reuse, but detects conflicting IDs and duplicate URL metadata', () => {
    const shared = auditCuratedContent(fixture(), [organization], '2026-11-05');
    expect(shared.errors).toEqual([]);
    expect(shared.sources.referenceUses).toBe(2);
    expect(shared.sources.uniqueUrls).toBe(1);
    expect(shared.warnings).toEqual([]);
    const collision = fixture();
    collision.profiles[0].facts[0].sources = [{ ...source, url: 'https://example.org/other' }];
    expect(auditCuratedContent(collision, [organization], '2026-11-05').errors.some(issue => issue.code === 'source-id-collision')).toBe(true);
    collision.profiles[0].facts[0].sources = [{ ...source, id: 'another-reference' }];
    expect(auditCuratedContent(collision, [organization], '2026-11-05').warnings.some(issue => issue.code === 'duplicate-source-url')).toBe(true);
  });

  it('rejects unsafe source destinations and handles date-only age deterministically', () => {
    const data = fixture();
    data.profiles[0].sources = [{ ...source, url: 'javascript:alert(1)' }];
    expect(auditCuratedContent(data, [organization], '2026-11-05').errors.some(issue => issue.message.includes('safe absolute HTTP(S)'))).toBe(true);
    expect(sourceAgeDays('2026-11-04', '2026-11-05')).toBe(1);
    expect(sourceAgeDays('2026-02-30', '2026-11-05')).toBeNull();
  });
});
