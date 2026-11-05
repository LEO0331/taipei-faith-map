import type { ReligiousOrganization } from '../../types';
import { checkEditorial, checkLocalized, checkSources, nonempty, resolveOrganizationIdentity } from '../../utils/curatedContent';
import { isCoordinateOutlier } from '../../utils/geo';
import type { CulturalRoute } from './routeTypes';
import { getRegistrationStatusObservation } from '../content-quality/dataQuality';

export function hasValidRouteCoordinates(organization: Pick<ReligiousOrganization, 'latitude' | 'longitude'>): boolean {
  return Number.isFinite(organization.latitude) && Number.isFinite(organization.longitude)
    && !isCoordinateOutlier(organization.longitude, organization.latitude);
}

/** Qualified source wording requires verification; it does not establish current status. */
export function isInactiveOrganization(name: string): boolean {
  return !!getRegistrationStatusObservation(name);
}

export function validateCulturalRoutes(routes: CulturalRoute[], organizations: ReligiousOrganization[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const [index, route] of routes.entries()) {
    const path = `routes[${index}] (${route.id})`;
    if (!nonempty(route.id)) errors.push(`${path}.id must be nonempty`);
    if (ids.has(route.id)) errors.push(`${path}: duplicate route identifier`);
    ids.add(route.id);
    checkLocalized(route.title, `${path}.title`, errors);
    checkLocalized(route.description, `${path}.description`, errors);
    checkEditorial(route, path, errors);
    if (!['heritage', 'multi-faith', 'architecture', 'community'].includes(route.theme)) errors.push(`${path}: invalid route theme`);
    if (!Array.isArray(route.districtLabels) || !route.districtLabels.length || route.districtLabels.some(label => !nonempty(label))) errors.push(`${path}: district labels required`);
    if (!Array.isArray(route.stops) || route.stops.length < 2 || route.stops.length > 5) {
      errors.push(`${path}: route must contain two to five distinct stops`);
      continue;
    }
    const stopIds = new Set<string>();
    for (const [stopIndex, stop] of route.stops.entries()) {
      const stopPath = `${path}.stops[${stopIndex}]`;
      if (stopIds.has(stop.organizationId)) errors.push(`${stopPath}: duplicate organization within route`);
      stopIds.add(stop.organizationId);
      for (const field of ['organizationId', 'organizationName', 'district', 'address'] as const) {
        if (!nonempty(stop[field])) errors.push(`${stopPath}.${field} must be nonempty`);
      }
      checkLocalized(stop.title, `${stopPath}.title`, errors);
      checkLocalized(stop.description, `${stopPath}.description`, errors);
      checkSources(stop.sourceReferences, `${stopPath}.sourceReferences`, errors);
      const matched = resolveOrganizationIdentity(stop, organizations);
      if (!matched) errors.push(`${stopPath}: missing, stale or ambiguous organization identity`);
      else {
        if (!hasValidRouteCoordinates(matched) || matched.isCoordinateOutlier) errors.push(`${stopPath}: invalid Taipei coordinates`);
        if (isInactiveOrganization(matched.name)) errors.push(`${stopPath}: registration-status annotation requires separate current verification; excluded from routes`);
      }
      if (!route.districtLabels?.includes(stop.district)) errors.push(`${stopPath}: district not represented in route labels`);
    }
  }
  return errors;
}
