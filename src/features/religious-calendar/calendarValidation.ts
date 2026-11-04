import type { ReligiousOrganization } from '../../types';
import { checkEditorial, checkLocalized, checkSources, isValidDateOnly, nonempty, resolveOrganizationIdentity } from '../../utils/curatedContent';
import { getSafeSourceUrl } from '../faith-spaces/culturalSources';
import type { ConfirmedCulturalEvent, ResolvedCalendarEvent } from './calendarTypes';

const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function validateCulturalEvents(events: ConfirmedCulturalEvent[], organizations: ReligiousOrganization[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [index, event] of events.entries()) {
    const path = `events[${index}] (${event.id})`;
    if (!nonempty(event.id)) errors.push(`${path}.id must be nonempty`);
    if (ids.has(event.id)) errors.push(`${path}: duplicate event ID`);
    ids.add(event.id);
    checkLocalized(event.title, `${path}.title`, errors);
    checkLocalized(event.description, `${path}.description`, errors);
    checkLocalized(event.location, `${path}.location`, errors);
    checkSources(event.sources, `${path}.sources`, errors);
    checkEditorial({ lastReviewed: event.verifiedAt, editorialReviewStatus: event.editorialReviewStatus }, path, errors);
    if (!resolveOrganizationIdentity(event, organizations)) errors.push(`${path}: missing, stale or ambiguous organization identity`);
    if (!isValidDateOnly(event.startDate) || !isValidDateOnly(event.endDate) || event.endDate < event.startDate) errors.push(`${path}: invalid date range`);
    if (event.timeZone !== 'Asia/Taipei') errors.push(`${path}: timeZone must be Asia/Taipei`);
    if (!['public', 'registration-required', 'restricted', 'unknown'].includes(event.attendance)) errors.push(`${path}: invalid attendance status`);
    if (!['confirmed', 'cancelled', 'postponed'].includes(event.status)) errors.push(`${path}: invalid event status`);
    if (event.startTime !== undefined && !validTime(event.startTime)) errors.push(`${path}: invalid start time`);
    if (event.endTime !== undefined && !validTime(event.endTime)) errors.push(`${path}: invalid end time`);
    if (event.endTime && !event.startTime) errors.push(`${path}: end time requires a start time`);
    if (event.startDate === event.endDate && event.startTime && event.endTime && event.endTime < event.startTime) errors.push(`${path}: end time precedes start time`);
    if (event.registrationUrl !== undefined && !getSafeSourceUrl(event.registrationUrl)) errors.push(`${path}: unsafe registration URL`);
  }
  return errors;
}

export function resolveCulturalEvents(events: ConfirmedCulturalEvent[], organizations: ReligiousOrganization[]): ResolvedCalendarEvent[] {
  const duplicateIds = new Set(events.filter((event, index) => events.findIndex(other => other.id === event.id) !== index).map(event => event.id));
  return events.flatMap(event => {
    if (duplicateIds.has(event.id) || event.editorialReviewStatus === 'pending' || validateCulturalEvents([event], organizations).length) return [];
    const organization = resolveOrganizationIdentity(event, organizations);
    return organization ? [{ event, organization }] : [];
  });
}
