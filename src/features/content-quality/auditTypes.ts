import type { ReligionType } from '../../types';
import type { PlaceProfile, SourceReference, TraditionContent } from '../faith-spaces/placeProfileTypes';
import type { ConfirmedCulturalEvent } from '../religious-calendar/calendarTypes';
import type { CulturalRoute } from '../cultural-routes/routeTypes';
import type { HeritageContent } from '../heritage/heritageTypes';
import type { assessGovernmentData } from './dataQuality';

export type CuratedAuditData = HeritageContent & {
  profiles: PlaceProfile[];
  traditions: TraditionContent[];
  events: ConfirmedCulturalEvent[];
  routes: CulturalRoute[];
};
export type ContentKind = 'profiles' | 'traditions' | 'events' | 'routes' | 'milestones' | 'stories' | 'places';
export type AuditIssue = { code: string; scope: string; message: string };
export type SourceOccurrence = { scope: string; source: SourceReference };
export type ContentCoverage = {
  totalProfiles: number;
  publishedProfiles: number;
  pendingProfiles: number;
  unmatchedOrInvalidProfiles: number;
  byReligion: Array<{ religion: ReligionType; organizations: number; profiles: number }>;
};
export type ContentAuditReport = {
  asOf: string;
  policy: { eventReviewDays: number; referenceReviewDays: number };
  counts: Record<ContentKind, number>;
  chapterCount: number;
  errors: AuditIssue[];
  warnings: AuditIssue[];
  coverage: ContentCoverage;
  sources: { referenceUses: number; uniqueUrls: number; checks: Array<{ url: string; verifiedAt: string; ageDays: number | null; scopes: string[] }> };
  editorial: { pending: number; internalReviewed: number; communityReviewed: number };
  timeSensitiveEvents: Array<{ id: string; startDate: string; endDate: string; verifiedAt: string; ageDays: number | null; needsReverification: boolean }>;
  government: ReturnType<typeof assessGovernmentData>;
};
