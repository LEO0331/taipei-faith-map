import type { ReligiousOrganization } from '../types';
import type { RelatedCulturalItem } from '../components/relatedContentTypes';
import { resolveOrganizationIdentity, isValidDateOnly } from './curatedContent';
import { getAvailableHeritage } from '../features/heritage/heritageLookup';
import { getAvailableRoutes } from '../features/cultural-routes/routeLookup';
import { culturalEvents } from '../features/religious-calendar/culturalEvents';
import { resolveCulturalEvents } from '../features/religious-calendar/calendarValidation';
import { formatCalendarDate, getTaipeiToday, isRecentVerification, upcomingEvents } from '../features/religious-calendar/calendarUtils';

/** Import only behind the existing cultural feature boundary: this reads curated catalogs. */
export function getRelatedCulturalItems(organization: ReligiousOrganization, organizations: ReligiousOrganization[], today = getTaipeiToday()): RelatedCulturalItem[] {
  const subject = resolveOrganizationIdentity({ organizationId: organization.id, organizationName: organization.name, district: organization.district, address: organization.address }, organizations);
  if (!subject) return [];
  const items: RelatedCulturalItem[] = [];
  const heritage = getAvailableHeritage(organizations);
  for (const milestone of heritage.milestones) {
    if (!milestone.organizationIds.includes(subject.id)) continue;
    items.push({ target: { kind: 'milestone', id: milestone.id, organizationId: subject.id }, title: milestone.title, detail: milestone.date.displayLabel });
  }
  for (const story of heritage.stories) {
    if (!story.chapters.some(chapter => chapter.organizationIds.includes(subject.id))) continue;
    items.push({ target: { kind: 'story', id: story.id, organizationId: subject.id }, title: story.title, detail: story.subtitle });
  }
  for (const { route } of getAvailableRoutes(organizations)) {
    if (!route.stops.some(stop => stop.organizationId === subject.id)) continue;
    items.push({ target: { kind: 'route', id: route.id, organizationId: subject.id }, title: route.title,
      detail: { zh: `${route.stops.length} 個停留點 · ${route.districtLabels.join('、')}`, en: `${route.stops.length} stops · ${route.districtLabels.join(', ')}` } });
  }
  if (isValidDateOnly(today)) {
    const resolved = resolveCulturalEvents(culturalEvents, organizations).filter(item => item.organization.id === subject.id);
    for (const event of upcomingEvents(resolved.map(item => item.event), today)) {
      const dates = (language: 'zh' | 'en') => `${formatCalendarDate(event.startDate, language)}${event.endDate === event.startDate ? '' : ` – ${formatCalendarDate(event.endDate, language)}`}`;
      const recent = isRecentVerification(event.verifiedAt, today);
      items.push({ target: { kind: 'event', id: event.id, organizationId: subject.id }, title: event.title,
        detail: {
          zh: `${dates('zh')} · ${recent ? '來源核對' : '較早的來源核對'}：${event.verifiedAt}；請以主辦最新公告為準。`,
          en: `${dates('en')} · ${recent ? 'Source checked' : 'Older source check'}: ${event.verifiedAt}; consult the organizer’s latest notice.`,
        } });
    }
  }
  return items;
}
