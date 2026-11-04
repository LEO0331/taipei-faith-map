import type { ReligiousOrganization } from '../../types';
import type { OrganizationIdentity } from '../../utils/curatedContent';
import type { EditorialReviewStatus, LocalizedText, SourceReference } from '../faith-spaces/placeProfileTypes';

export type FestivalReference = {
  id: string;
  organizationId: string;
  originalDateText: string;
  calendarSystem: 'gregorian' | 'lunar' | 'unknown';
  interpretationStatus: 'unparsed' | 'reviewed';
  sourceType: 'government-open-data';
};

/** A dated, source-backed occurrence; never generated from recurring festival text. */
export type ConfirmedCulturalEvent = OrganizationIdentity & {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  location: LocalizedText;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  timeZone: 'Asia/Taipei';
  attendance: 'public' | 'registration-required' | 'restricted' | 'unknown';
  registrationUrl?: string;
  sources: SourceReference[];
  verifiedAt: string;
  editorialReviewStatus: EditorialReviewStatus;
  status: 'confirmed' | 'cancelled' | 'postponed';
};

export type ResolvedCalendarEvent = { event: ConfirmedCulturalEvent; organization: ReligiousOrganization };
export type CalendarFilters = { religion: string; district: string; keyword: string };
