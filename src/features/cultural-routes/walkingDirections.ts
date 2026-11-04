import type { ReligiousOrganization } from '../../types';
import { hasValidRouteCoordinates } from './routeValidation';

type Coordinates = Pick<ReligiousOrganization, 'latitude' | 'longitude'>;
export type WalkingDirections = {
  url?: string;
  legs: { fromIndex: number; toIndex: number; url: string }[];
  usesLegs: boolean;
};
type Options = { maxWaypoints?: number; maxUrlLength?: number };
const point = (value: Coordinates) => `${value.latitude},${value.longitude}`;

/** Three waypoints also works with Google Maps' conservative mobile-browser limit. */
export function buildWalkingDirectionsUrl(stops: Coordinates[], { maxWaypoints = 3, maxUrlLength = 2000 }: Options = {}): string | undefined {
  if (stops.length < 2 || stops.some(stop => !hasValidRouteCoordinates(stop))) return undefined;
  if (stops.length - 2 > Math.max(0, Math.min(3, maxWaypoints))) return undefined;
  const parameters = new URLSearchParams({ api: '1', origin: point(stops[0]), destination: point(stops[stops.length - 1]), travelmode: 'walking' });
  if (stops.length > 2) parameters.set('waypoints', stops.slice(1, -1).map(point).join('|'));
  const url = `https://www.google.com/maps/dir/?${parameters.toString()}`;
  return url.length <= Math.min(2000, maxUrlLength) ? url : undefined;
}

export function getWalkingDirections(stops: Coordinates[], options: Options = {}): WalkingDirections | undefined {
  if (stops.length < 2 || stops.some(stop => !hasValidRouteCoordinates(stop))) return undefined;
  const url = buildWalkingDirectionsUrl(stops, options);
  if (url) return { url, legs: [], usesLegs: false };
  const legs = stops.slice(0, -1).map((stop, index) => ({
    fromIndex: index, toIndex: index + 1,
    url: buildWalkingDirectionsUrl([stop, stops[index + 1]])!,
  }));
  return legs.every(leg => leg.url) ? { legs, usesLegs: true } : undefined;
}
