import type { ReligiousOrganization } from '../../types';
import { checkEditorial, checkLocalized, checkSources, isValidDateOnly, nonempty, resolveOrganizationIdentity } from '../../utils/curatedContent';
import { culturalRoutes } from '../cultural-routes/culturalRoutes';
import { RELIGION_TYPES } from '../../utils/data';
import type { HeritageContent, HistoricalDate } from './heritageTypes';

const validYear = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 9999;
const normalized = (value: string) => value.normalize('NFC').trim().replace(/\s+/gu, ' ');

export function validateHistoricalDate(date: HistoricalDate): string[] {
  const errors: string[] = [];
  if (!date || typeof date !== 'object') return ['historical date must be an object'];
  checkLocalized(date.displayLabel, 'date.displayLabel', errors);
  if (!['gregorian', 'lunar', 'other'].includes(date.calendarSystem)) errors.push('date.calendarSystem must be explicit');
  if (!['exact', 'year', 'approximate', 'range', 'unknown'].includes(date.precision)) errors.push('date.precision is invalid');
  if (date.precision === 'unknown') {
    if (date.startYear !== undefined || date.endYear !== undefined || date.exactDate !== undefined) errors.push('unknown dates cannot contain invented year or day values');
    return errors;
  }
  if (!validYear(date.startYear)) errors.push('date.startYear must be an integer from 1 through 9999');
  if (date.precision === 'range') {
    if (!validYear(date.endYear) || !validYear(date.startYear) || date.endYear < date.startYear) errors.push('date range must have chronological integer years');
  } else if (date.endYear !== undefined) errors.push('date.endYear is only valid for range precision');
  if (date.precision === 'exact') {
    if (date.calendarSystem !== 'gregorian' || !date.exactDate || !isValidDateOnly(date.exactDate)) errors.push('exact dates require an established valid Gregorian date');
    else if (Number(date.exactDate.slice(0, 4)) !== date.startYear) errors.push('exactDate and startYear must agree');
  } else if (date.exactDate !== undefined) errors.push('non-exact dates cannot contain an exactDate');
  return errors;
}

function checkReferences(ids: string[], known: Set<string>, path: string, errors: string[]) {
  if (!Array.isArray(ids)) { errors.push(`${path} must be an array`); return; }
  const seen = new Set<string>();
  for (const id of ids) {
    if (!nonempty(id) || !known.has(id)) errors.push(`${path}: missing reference ${id}`);
    if (seen.has(id)) errors.push(`${path}: duplicate reference ${id}`);
    seen.add(id);
  }
}

/** Structural/editorial validation is offline; contributors still need to read the evidence. */
export function validateHeritageContent(data: HeritageContent, organizations: ReligiousOrganization[], routeIds: string[] = culturalRoutes.map(route => route.id)): string[] {
  const errors: string[] = [];
  if (!data || !Array.isArray(data.milestones) || !Array.isArray(data.stories) || !Array.isArray(data.places)) return ['heritage content requires milestone, story and place arrays'];
  const milestoneIds = new Set(data.milestones.map(item => item.id));
  const storyIds = new Set(data.stories.map(item => item.id));
  const placeIds = new Set(data.places.map(item => item.organizationId));
  const knownRoutes = new Set(routeIds);
  const seenPlaces = new Set<string>();
  for (const [index, place] of data.places.entries()) {
    const path = `places[${index}]`;
    for (const field of ['organizationId', 'organizationName', 'district', 'address'] as const) {
      if (!nonempty(place[field])) errors.push(`${path}.${field} must be nonempty`);
    }
    if (seenPlaces.has(place.organizationId)) errors.push(`${path}: duplicate organization reference`);
    seenPlaces.add(place.organizationId);
    if (!resolveOrganizationIdentity(place, organizations)) errors.push(`${path}: missing, stale or ambiguous organization identity`);
    checkLocalized(place.relationship, `${path}.relationship`, errors);
    checkSources(place.sources, `${path}.sources`, errors);
  }
  const seenMilestones = new Set<string>();
  const translatedMilestones = new Set<string>();
  for (const [index, milestone] of data.milestones.entries()) {
    const path = `milestones[${index}] (${milestone.id})`;
    if (!nonempty(milestone.id)) errors.push(`${path}.id must be nonempty`);
    if (seenMilestones.has(milestone.id)) errors.push(`${path}: duplicate milestone ID`);
    seenMilestones.add(milestone.id);
    checkLocalized(milestone.title, `${path}.title`, errors);
    checkLocalized(milestone.summary, `${path}.summary`, errors);
    errors.push(...validateHistoricalDate(milestone.date).map(error => `${path}: ${error}`));
    if (!['foundation', 'architecture', 'community', 'heritage', 'transformation'].includes(milestone.theme)) errors.push(`${path}: invalid historical theme`);
    checkSources(milestone.sources, `${path}.sources`, errors);
    checkEditorial(milestone, path, errors);
    checkReferences(milestone.organizationIds, placeIds, `${path}.organizationIds`, errors);
    checkReferences(milestone.storyIds, storyIds, `${path}.storyIds`, errors);
    if (milestone.religions !== undefined) checkReferences(milestone.religions, new Set(RELIGION_TYPES), `${path}.religions`, errors);
    if (milestone.districts !== undefined && (!Array.isArray(milestone.districts) || milestone.districts.some(value => !nonempty(value)) || new Set(milestone.districts).size !== milestone.districts.length)) errors.push(`${path}.districts must contain distinct nonempty labels`);
    for (const storyId of milestone.storyIds) {
      const story = data.stories.find(item => item.id === storyId);
      if (story && !story.chapters.some(chapter => chapter.milestoneIds.includes(milestone.id))) errors.push(`${path}: story relationship is not reciprocal`);
    }
    for (const language of ['zh', 'en'] as const) {
      if (!nonempty(milestone.title?.[language])) continue;
      const key = JSON.stringify([language, normalized(milestone.title[language]), milestone.theme, milestone.date?.startYear, milestone.date?.endYear, milestone.date?.exactDate, [...milestone.organizationIds].sort()]);
      if (translatedMilestones.has(key)) errors.push(`${path}: duplicate milestone translation identity`);
      translatedMilestones.add(key);
    }
  }
  const seenStories = new Set<string>();
  const translatedStories = new Set<string>();
  for (const [index, story] of data.stories.entries()) {
    const path = `stories[${index}] (${story.id})`;
    if (!nonempty(story.id)) errors.push(`${path}.id must be nonempty`);
    if (seenStories.has(story.id)) errors.push(`${path}: duplicate story ID`);
    seenStories.add(story.id);
    for (const field of ['title', 'subtitle', 'introduction'] as const) checkLocalized(story[field], `${path}.${field}`, errors);
    if (story.conclusion !== undefined) checkLocalized(story.conclusion, `${path}.conclusion`, errors);
    for (const language of ['zh', 'en'] as const) {
      if (!nonempty(story.title?.[language])) continue;
      const key = `${language}:${normalized(story.title[language])}`;
      if (translatedStories.has(key)) errors.push(`${path}: duplicate story translation identity`);
      translatedStories.add(key);
    }
    if (!['architecture', 'community', 'history', 'multi-faith'].includes(story.theme)) errors.push(`${path}: invalid story theme`);
    checkSources(story.sources, `${path}.sources`, errors);
    checkEditorial(story, path, errors);
    checkReferences(story.routeIds ?? [], knownRoutes, `${path}.routeIds`, errors);
    if (!Array.isArray(story.chapters) || story.chapters.length === 0) { errors.push(`${path}: story requires chapters`); continue; }
    const chapters = new Set<string>();
    for (const [chapterIndex, chapter] of story.chapters.entries()) {
      const chapterPath = `${path}.chapters[${chapterIndex}]`;
      if (!nonempty(chapter.id)) errors.push(`${chapterPath}.id must be nonempty`);
      if (chapters.has(chapter.id)) errors.push(`${chapterPath}: duplicate chapter ID`);
      chapters.add(chapter.id);
      checkLocalized(chapter.title, `${chapterPath}.title`, errors);
      checkLocalized(chapter.content, `${chapterPath}.content`, errors);
      checkSources(chapter.sources, `${chapterPath}.sources`, errors);
      checkReferences(chapter.milestoneIds, milestoneIds, `${chapterPath}.milestoneIds`, errors);
      checkReferences(chapter.organizationIds, placeIds, `${chapterPath}.organizationIds`, errors);
      for (const milestoneId of chapter.milestoneIds) {
        const milestone = data.milestones.find(item => item.id === milestoneId);
        if (milestone && !milestone.storyIds.includes(story.id)) errors.push(`${chapterPath}: milestone relationship is not reciprocal`);
      }
    }
  }
  return errors;
}
