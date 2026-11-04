import { describe, expect, it } from 'vitest';
import { buildWalkingDirectionsUrl, getWalkingDirections } from '../walkingDirections';

const stops = Array.from({ length: 6 }, (_, index) => ({ latitude: 25.03 + index / 1000, longitude: 121.5 + index / 1000 }));

describe('external walking navigation', () => {
  it('builds encoded Google Maps walking links in the exact stop order', () => {
    const href = buildWalkingDirectionsUrl(stops.slice(0, 5))!;
    const url = new URL(href);
    expect(url.origin).toBe('https://www.google.com');
    expect(url.pathname).toBe('/maps/dir/');
    expect(url.searchParams.get('travelmode')).toBe('walking');
    expect(url.searchParams.get('origin')).toBe(`${stops[0].latitude},${stops[0].longitude}`);
    expect(url.searchParams.get('destination')).toBe(`${stops[4].latitude},${stops[4].longitude}`);
    expect(url.searchParams.get('waypoints')).toBe(stops.slice(1, 4).map(stop => `${stop.latitude},${stop.longitude}`).join('|'));
    expect(href).toContain('%7C');
    expect(getWalkingDirections(stops.slice(0, 2))?.usesLegs).toBe(false);
    expect(new URL(buildWalkingDirectionsUrl(stops.slice(0, 2))!).searchParams.has('waypoints')).toBe(false);
  });

  it('falls back to ordered per-leg directions beyond conservative waypoint limits', () => {
    expect(buildWalkingDirectionsUrl(stops)).toBeUndefined();
    const directions = getWalkingDirections(stops)!;
    expect(directions.usesLegs).toBe(true);
    expect(directions.url).toBeUndefined();
    expect(directions.legs).toHaveLength(5);
    for (const [index, leg] of directions.legs.entries()) {
      expect(leg.fromIndex).toBe(index);
      expect(leg.toIndex).toBe(index + 1);
      expect(new URL(leg.url).searchParams.get('origin')).toBe(`${stops[index].latitude},${stops[index].longitude}`);
      expect(new URL(leg.url).searchParams.get('destination')).toBe(`${stops[index + 1].latitude},${stops[index + 1].longitude}`);
    }
  });

  it('falls back to per-leg links if a combined URL exceeds the allowed length', () => {
    expect(buildWalkingDirectionsUrl(stops.slice(0, 3), { maxUrlLength: 50 })).toBeUndefined();
    expect(getWalkingDirections(stops.slice(0, 3), { maxUrlLength: 50 })?.legs).toHaveLength(2);
    expect(getWalkingDirections(stops.slice(0, 3), { maxWaypoints: 0 })?.usesLegs).toBe(true);
  });

  it('never generates directions from incomplete, nonfinite or non-Taipei coordinates', () => {
    for (const invalid of [[], stops.slice(0, 1), [stops[0], { latitude: NaN, longitude: 121.5 }], [stops[0], { latitude: 25, longitude: 200 }]]) {
      expect(buildWalkingDirectionsUrl(invalid)).toBeUndefined();
      expect(getWalkingDirections(invalid)).toBeUndefined();
    }
  });
});
