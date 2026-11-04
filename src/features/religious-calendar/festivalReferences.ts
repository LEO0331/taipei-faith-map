import type { ReligiousOrganization } from '../../types';
import type { CalendarFilters, FestivalReference } from './calendarTypes';

export function buildFestivalReferences(organizations: ReligiousOrganization[]): FestivalReference[] {
  return organizations.flatMap(organization => organization.festivalDates.map((originalDateText, index) => {
    const lunar = /農曆|阴历|陰曆|lunar/i.test(originalDateText);
    const gregorian = /國曆|陽曆|公曆|gregorian/i.test(originalDateText);
    return {
    id: `${organization.id}:festival:${index}`,
    organizationId: organization.id,
    originalDateText,
    calendarSystem: lunar && !gregorian ? 'lunar' : gregorian && !lunar ? 'gregorian' : 'unknown',
    interpretationStatus: 'unparsed' as const,
    sourceType: 'government-open-data' as const,
  }; }) as FestivalReference[]);
}

export function organizationMatchesFilters(organization: ReligiousOrganization, filters: CalendarFilters, extraText = ''): boolean {
  const keyword = filters.keyword.trim().toLocaleLowerCase();
  return (!filters.religion || organization.religion === filters.religion)
    && (!filters.district || organization.district === filters.district)
    && (!keyword || [organization.name, organization.address, organization.religion, organization.district, extraText].join(' ').toLocaleLowerCase().includes(keyword));
}
