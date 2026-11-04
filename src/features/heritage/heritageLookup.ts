import type { Language, ReligiousOrganization } from '../../types';
import { checkLocalized, checkSources, resolveOrganizationIdentity } from '../../utils/curatedContent';
import { heritageStories } from './heritageStories';
import { historicalMilestones } from './historicalMilestones';
import { heritageOrganizations } from './heritageOrganizations';
import { validateHeritageContent } from './heritageValidation';
import type { HeritageContent, HeritagePlaceReference, HistoricalDate, HistoricalMilestone } from './heritageTypes';

/** Source-year ordering is deterministic; undated records stay last, never at a guessed year. */
export function sortHistoricalMilestones(milestones: HistoricalMilestone[]): HistoricalMilestone[] {
  const rank = (date: HistoricalDate) => date.precision === 'exact' ? 1 : 0;
  return [...milestones].sort((left, right) => {
    const yearDifference = (left.date.startYear ?? Infinity) - (right.date.startYear ?? Infinity);
    if (yearDifference && Number.isFinite(yearDifference)) return yearDifference;
    if (left.date.startYear === undefined && right.date.startYear !== undefined) return 1;
    if (right.date.startYear === undefined && left.date.startYear !== undefined) return -1;
    return rank(left.date) - rank(right.date)
      || (left.date.exactDate ?? '').localeCompare(right.date.exactDate ?? '')
      || (left.date.endYear ?? left.date.startYear ?? 0) - (right.date.endYear ?? right.date.startYear ?? 0)
      || left.id.localeCompare(right.id);
  });
}

export function formatHistoricalDate(date: HistoricalDate, language: Language): string {
  return date.displayLabel[language];
}

export function resolveHeritagePlaces(ids: string[], places: HeritagePlaceReference[], organizations: ReligiousOrganization[]): ReligiousOrganization[] {
  if (new Set(ids).size !== ids.length) return [];
  const resolved: ReligiousOrganization[] = [];
  for (const id of ids) {
    const matches = places.filter(place => place.organizationId === id);
    if (matches.length !== 1) return [];
    const errors: string[] = [];
    checkLocalized(matches[0].relationship, 'place.relationship', errors);
    checkSources(matches[0].sources, 'place.sources', errors);
    if (errors.length) return [];
    const organization = resolveOrganizationIdentity(matches[0], organizations);
    if (!organization) return [];
    resolved.push(organization);
  }
  return resolved;
}

const defaultContent: HeritageContent = { milestones: historicalMilestones, stories: heritageStories, places: heritageOrganizations };

export function getAvailableHeritage(organizations: ReligiousOrganization[], data: HeritageContent = defaultContent, routeIds?: string[]): HeritageContent {
  const empty: HeritageContent = { milestones: [], stories: [], places: [] };
  if (validateHeritageContent(data, organizations, routeIds).length) return empty;
  let milestones = data.milestones.filter(item => item.editorialReviewStatus !== 'pending');
  let stories = data.stories.filter(item => item.editorialReviewStatus !== 'pending');
  let changed = true;
  while (changed) {
    const milestoneIds = new Set(milestones.map(item => item.id));
    const storyIds = new Set(stories.map(item => item.id));
    const nextMilestones = milestones.filter(item => item.storyIds.every(id => storyIds.has(id)));
    const nextStories = stories.filter(item => item.chapters.every(chapter => chapter.milestoneIds.every(id => milestoneIds.has(id))));
    changed = nextMilestones.length !== milestones.length || nextStories.length !== stories.length;
    milestones = nextMilestones;
    stories = nextStories;
  }
  return { milestones: sortHistoricalMilestones(milestones), stories, places: data.places };
}
