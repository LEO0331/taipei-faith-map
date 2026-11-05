import { describe, expect, it } from 'vitest';
import organizationsJson from '../../../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../../../types';
import { culturalRoutes } from '../culturalRoutes';
import { getAvailableRoutes, resolveCulturalRoute } from '../routeLookup';
import { validateCulturalRoutes } from '../routeValidation';

const organizations = organizationsJson as ReligiousOrganization[];
const route = culturalRoutes[0];

describe('curated walking route identities and evidence', () => {
  it('validates the reviewed collection against real organizations offline', () => {
    expect(culturalRoutes.length).toBeGreaterThanOrEqual(2);
    expect(validateCulturalRoutes(culturalRoutes, organizations)).toEqual([]);
    const available = getAvailableRoutes(organizations);
    expect(available).toHaveLength(culturalRoutes.length);
    for (const resolved of available) {
      expect(resolved.organizations.map(item => item.id)).toEqual(resolved.route.stops.map(stop => stop.organizationId));
      expect(resolved.route.editorialReviewStatus).toBe('internal-reviewed');
    }
    expect(validateCulturalRoutes(culturalRoutes, [...organizations].reverse())).toEqual([]);
  });

  it('rejects duplicate route identifiers and repeated stops', () => {
    expect(validateCulturalRoutes([route, route], organizations).join(' ')).toContain('duplicate route identifier');
    expect(getAvailableRoutes(organizations, [route, route])).toEqual([]);
    const repeated = { ...route, stops: [route.stops[0], route.stops[0]] };
    expect(validateCulturalRoutes([repeated], organizations).join(' ')).toContain('duplicate organization');
    expect(resolveCulturalRoute(repeated, organizations)).toBeUndefined();
    expect(validateCulturalRoutes([{ ...route, stops: [route.stops[0]] }], organizations).join(' ')).toContain('two to five');
  });

  it('withholds routes with missing, duplicated or stale organization identities', () => {
    const first = organizations.find(item => item.id === route.stops[0].organizationId)!;
    const missing = organizations.filter(item => item.id !== first.id);
    expect(resolveCulturalRoute(route, missing)).toBeUndefined();
    expect(resolveCulturalRoute(route, [...organizations, first])).toBeUndefined();
    expect(resolveCulturalRoute(route, [...organizations, { ...first, id: 'duplicate-identity' }])).toBeUndefined();
    for (const field of ['name', 'district', 'address'] as const) {
      const stale = organizations.map(item => item.id === first.id ? { ...item, [field]: `${item[field]}changed` } : item);
      expect(resolveCulturalRoute(route, stale)).toBeUndefined();
    }
  });

  it('rejects invalid or outlying coordinates and explicitly inactive records', () => {
    const firstId = route.stops[0].organizationId;
    for (const position of [{ latitude: NaN }, { longitude: Infinity }, { latitude: 24 }, { isCoordinateOutlier: true }]) {
      const invalid = organizations.map(item => item.id === firstId ? { ...item, ...position } : item);
      expect(validateCulturalRoutes([route], invalid).join(' ')).toContain('invalid Taipei coordinates');
      expect(resolveCulturalRoute(route, invalid)).toBeUndefined();
    }
    const inactiveName = `${route.stops[0].organizationName}(已廢止)`;
    const inactive = organizations.map(item => item.id === firstId ? { ...item, name: inactiveName } : item);
    const inactiveRoute = { ...route, stops: route.stops.map((stop, index) => index === 0 ? { ...stop, organizationName: inactiveName } : stop) };
    expect(validateCulturalRoutes([inactiveRoute], inactive).join(' ')).toContain('registration-status annotation');
    const historicalName = `廢止制度研究${route.stops[0].organizationName}`;
    const unusualRecords = organizations.map(item => item.id === firstId ? { ...item, name: historicalName } : item);
    const unusualRoute = { ...route, stops: route.stops.map((stop, index) => index === 0 ? { ...stop, organizationName: historicalName } : stop) };
    expect(validateCulturalRoutes([unusualRoute], unusualRecords)).toEqual([]);
  });

  it('checks bilingual fields, source URLs, district coverage and review metadata', () => {
    const invalid = structuredClone(route);
    invalid.title.en = '';
    invalid.description.zh = ' ';
    invalid.districtLabels = [];
    invalid.lastReviewed = '2026-02-30';
    invalid.stops[0].sourceReferences[0].url = 'javascript:alert(1)';
    invalid.stops[1].description.en = '';
    const errors = validateCulturalRoutes([invalid], organizations).join(' ');
    for (const fragment of ['title.en', 'description.zh', 'district labels', 'lastReviewed', 'safe absolute HTTP(S)', 'description.en']) expect(errors).toContain(fragment);
    expect(resolveCulturalRoute(invalid, organizations)).toBeUndefined();
  });

  it('never presents pending content as a reviewed public route', () => {
    const pending = { ...route, editorialReviewStatus: 'pending' as const };
    expect(getAvailableRoutes(organizations, [pending])).toEqual([]);
    const unsourced = structuredClone(route);
    unsourced.stops[0].sourceReferences = [];
    expect(resolveCulturalRoute(unsourced, organizations)).toBeUndefined();
  });
});
