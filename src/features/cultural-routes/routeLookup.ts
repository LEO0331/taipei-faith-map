import type { ReligiousOrganization } from '../../types';
import { resolveOrganizationIdentity } from '../../utils/curatedContent';
import { culturalRoutes } from './culturalRoutes';
import { validateCulturalRoutes } from './routeValidation';
import type { CulturalRoute, ResolvedCulturalRoute } from './routeTypes';

export function resolveCulturalRoute(route: CulturalRoute, organizations: ReligiousOrganization[]): ResolvedCulturalRoute | undefined {
  if (route.editorialReviewStatus === 'pending' || validateCulturalRoutes([route], organizations).length) return undefined;
  const resolved = route.stops.map(stop => resolveOrganizationIdentity(stop, organizations));
  if (resolved.some(organization => !organization)) return undefined;
  return { route, organizations: resolved as ReligiousOrganization[] };
}

/** Invalid or ambiguous content is withheld; the generated dataset is never repaired by guessing. */
export function getAvailableRoutes(organizations: ReligiousOrganization[], routes: CulturalRoute[] = culturalRoutes): ResolvedCulturalRoute[] {
  return routes.flatMap(route => {
    if (routes.filter(candidate => candidate.id === route.id).length !== 1) return [];
    const resolved = resolveCulturalRoute(route, organizations);
    return resolved ? [resolved] : [];
  });
}
