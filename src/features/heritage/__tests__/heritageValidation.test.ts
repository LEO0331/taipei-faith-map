import { describe, expect, it } from 'vitest';
import organizationsJson from '../../../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../../../types';
import type { SourceReference } from '../../faith-spaces/placeProfileTypes';
import type { HeritageContent } from '../heritageTypes';
import { validateHeritageContent } from '../heritageValidation';
import { getAvailableHeritage, resolveHeritagePlaces } from '../heritageLookup';
import { historicalMilestones } from '../historicalMilestones';
import { heritageStories } from '../heritageStories';
import { heritageOrganizations } from '../heritageOrganizations';

const organizations = organizationsJson as ReligiousOrganization[];
const organization = organizations[0];
const source: SourceReference = { id: 'fixture-source', title: { zh: '測試來源', en: 'Test source' }, url: 'https://example.org/history', publisher: 'Example archive', verifiedAt: '2026-11-04' };
const reviewed = { lastReviewed: '2026-11-04', editorialReviewStatus: 'internal-reviewed' as const };
const fixture = (): HeritageContent => ({
  places: [{ organizationId: organization.id, organizationName: organization.name, district: organization.district, address: organization.address, relationship: { zh: '與史料所述場所相關的現址登記。', en: 'A current registration associated with the sourced place.' }, sources: [source] }],
  milestones: [{ id: 'source-milestone', title: { zh: '史料年代', en: 'Documented year' }, summary: { zh: '有來源的歷史敘述。', en: 'A historical statement supported by a source.' }, date: { startYear: 1900, precision: 'year', calendarSystem: 'gregorian', displayLabel: { zh: '1900年', en: '1900' } }, theme: 'heritage', organizationIds: [organization.id], storyIds: ['source-story'], sources: [source], ...reviewed }],
  stories: [{ id: 'source-story', title: { zh: '歷史故事', en: 'A historical story' }, subtitle: { zh: '副標題', en: 'Subtitle' }, introduction: { zh: '有來源的故事介紹。', en: 'A source-backed introduction.' }, theme: 'history', sources: [source], ...reviewed, chapters: [{ id: 'chapter-one', title: { zh: '一個篇章', en: 'A chapter' }, content: { zh: '有來源的敘述。', en: 'Source-backed narrative.' }, milestoneIds: ['source-milestone'], organizationIds: [organization.id], sources: [source] }] }],
});

describe('heritage identities, evidence and relationships', () => {
  it('validates curated historical records against real current registrations offline', () => {
    const data = { milestones: historicalMilestones, stories: heritageStories, places: heritageOrganizations };
    expect(validateHeritageContent(data, organizations)).toEqual([]);
    const available = getAvailableHeritage(organizations);
    expect(available.stories.length).toBeGreaterThan(0);
    expect(available.milestones.length).toBeGreaterThan(0);
    expect(available.stories.every(story => story.editorialReviewStatus !== 'pending')).toBe(true);
    expect(validateHeritageContent(data, [...organizations].reverse())).toEqual([]);
  });

  it('accepts a sourced chapter or milestone with no current mapped organization', () => {
    const data = fixture();
    data.milestones[0].organizationIds = [];
    data.stories[0].chapters[0].organizationIds = [];
    expect(validateHeritageContent(data, organizations)).toEqual([]);
    expect(getAvailableHeritage(organizations, data).milestones).toHaveLength(1);
    expect(resolveHeritagePlaces([], data.places, organizations)).toEqual([]);
  });

  it('rejects missing, stale and ambiguous registrations rather than trusting an ID alone', () => {
    const data = fixture();
    expect(validateHeritageContent(data, []).join(' ')).toContain('organization identity');
    expect(getAvailableHeritage([], data).stories).toEqual([]);
    for (const field of ['name', 'district', 'address'] as const) {
      const stale = organizations.map(item => item.id === organization.id ? { ...item, [field]: `${item[field]}changed` } : item);
      expect(resolveHeritagePlaces([organization.id], data.places, stale)).toEqual([]);
      expect(getAvailableHeritage(stale, data).milestones).toEqual([]);
    }
    expect(resolveHeritagePlaces([organization.id], data.places, [...organizations, organization])).toEqual([]);
    expect(resolveHeritagePlaces([organization.id], data.places, [...organizations, { ...organization, id: 'another-id' }])).toEqual([]);
    expect(resolveHeritagePlaces([organization.id, organization.id], data.places, organizations)).toEqual([]);
    expect(resolveHeritagePlaces([organization.id], [...data.places, data.places[0]], organizations)).toEqual([]);
  });

  it('rejects duplicate milestone, story, chapter and place identifiers', () => {
    const data = fixture();
    data.milestones.push(structuredClone(data.milestones[0]));
    data.stories.push(structuredClone(data.stories[0]));
    data.stories[0].chapters.push(structuredClone(data.stories[0].chapters[0]));
    data.places.push(structuredClone(data.places[0]));
    const errors = validateHeritageContent(data, organizations).join(' ');
    for (const fragment of ['duplicate milestone ID', 'duplicate story ID', 'duplicate chapter ID', 'duplicate organization reference']) expect(errors).toContain(fragment);
    expect(getAvailableHeritage(organizations, data)).toEqual({ milestones: [], stories: [], places: [] });
  });

  it('rejects records duplicated under alternative translation IDs', () => {
    const data = fixture();
    data.milestones.push({ ...structuredClone(data.milestones[0]), id: 'translated-milestone' });
    data.stories.push({ ...structuredClone(data.stories[0]), id: 'translated-story' });
    const errors = validateHeritageContent(data, organizations).join(' ');
    expect(errors).toContain('duplicate milestone translation identity');
    expect(errors).toContain('duplicate story translation identity');
  });

  it('requires bilingual claims, evidence, safe links and editorial metadata', () => {
    const data = structuredClone(fixture());
    data.milestones[0].summary.en = '';
    data.milestones[0].sources = [];
    data.stories[0].subtitle.zh = ' ';
    data.stories[0].chapters[0].sources[0].url = 'javascript:alert(1)';
    data.stories[0].lastReviewed = '2026-02-30';
    const errors = validateHeritageContent(data, organizations).join(' ');
    for (const fragment of ['summary.en', 'source references', 'subtitle.zh', 'safe absolute HTTP(S)', 'lastReviewed']) expect(errors).toContain(fragment);
    expect(getAvailableHeritage(organizations, data).stories).toEqual([]);
    expect(resolveHeritagePlaces([organization.id], data.places, organizations)).toEqual([]);
  });

  it('validates milestone/story/chapter/route references and reciprocal relationships', () => {
    const data = fixture();
    data.stories[0].chapters[0].milestoneIds.push('missing-milestone');
    data.stories[0].chapters[0].organizationIds.push('missing-place');
    data.stories[0].routeIds = ['missing-route'];
    data.milestones[0].storyIds.push('missing-story');
    expect(validateHeritageContent(data, organizations, []).join(' ')).toContain('missing reference');
    const broken = fixture();
    broken.milestones[0].storyIds = [];
    expect(validateHeritageContent(broken, organizations).join(' ')).toContain('not reciprocal');
  });

  it('withholds pending assertions and records that depend on them', () => {
    const data = fixture();
    data.stories[0].editorialReviewStatus = 'pending';
    expect(validateHeritageContent(data, organizations)).toEqual([]);
    expect(getAvailableHeritage(organizations, data).stories).toEqual([]);
    expect(getAvailableHeritage(organizations, data).milestones).toEqual([]);
    data.stories[0].editorialReviewStatus = 'internal-reviewed';
    data.milestones[0].editorialReviewStatus = 'pending';
    expect(getAvailableHeritage(organizations, data).stories).toEqual([]);
  });

  it('validates historical classification without inferring a mapped historical place', () => {
    const data = fixture();
    data.milestones[0].organizationIds = [];
    data.milestones[0].religions = ['回教'];
    data.milestones[0].districts = ['大安區'];
    expect(validateHeritageContent(data, organizations)).toEqual([]);
    data.milestones[0].religions = ['made-up' as never];
    data.milestones[0].districts = ['', ''];
    expect(validateHeritageContent(data, organizations).join(' ')).toContain('religions');
    expect(validateHeritageContent(data, organizations).join(' ')).toContain('districts');
  });
});
