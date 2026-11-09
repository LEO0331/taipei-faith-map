import type { OrganizationIdentity } from '../../utils/curatedContent';
import type { ReligionType } from '../../types';
import type { EditorialReviewStatus, LocalizedText, SourceReference } from '../faith-spaces/placeProfileTypes';

/** Precision describes the source evidence, never an inferred Gregorian date. */
export type HistoricalDate = {
  startYear?: number;
  endYear?: number;
  exactDate?: string;
  precision: 'exact' | 'year' | 'approximate' | 'range' | 'unknown';
  calendarSystem: 'gregorian' | 'lunar' | 'other';
  displayLabel: LocalizedText;
};

export type HistoricalMilestone = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  date: HistoricalDate;
  theme: 'foundation' | 'architecture' | 'community' | 'heritage' | 'transformation';
  organizationIds: string[];
  storyIds: string[];
  religions?: ReligionType[];
  districts?: string[];
  sources: SourceReference[];
  lastReviewed: string;
  editorialReviewStatus: EditorialReviewStatus;
};

export type HeritageChapter = {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  milestoneIds: string[];
  organizationIds: string[];
  sources: SourceReference[];
};

export type HeritageStory = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  introduction: LocalizedText;
  conclusion?: LocalizedText;
  theme: 'architecture' | 'community' | 'history' | 'multi-faith';
  chapters: HeritageChapter[];
  sources: SourceReference[];
  routeIds?: string[];
  lastReviewed: string;
  editorialReviewStatus: EditorialReviewStatus;
};

/** Matches a current registration, not a historical institution or historical coordinate. */
export type HeritagePlaceReference = OrganizationIdentity & {
  relationship: LocalizedText;
  sources: SourceReference[];
};

export type HeritageContent = {
  milestones: HistoricalMilestone[];
  stories: HeritageStory[];
  places: HeritagePlaceReference[];
};

export type HeritageData = HeritageContent;
