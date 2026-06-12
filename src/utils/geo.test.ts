import { describe, expect, it } from 'vitest';
import { calculateDistanceMeters, convertTwd97ToWgs84, isCoordinateOutlier } from './geo';

describe('geo utilities', () => {
  it('converts Taipei TWD97 TM2 coordinates to WGS84 coordinates in Taipei bounds', () => {
    const result = convertTwd97ToWgs84(304000, 2770000);
    expect(result.longitude).toBeGreaterThan(121.4);
    expect(result.longitude).toBeLessThan(121.7);
    expect(result.latitude).toBeGreaterThan(24.9);
    expect(result.latitude).toBeLessThan(25.25);
    expect(isCoordinateOutlier(result.longitude, result.latitude)).toBe(false);
  });

  it('calculates nearby distances in meters', () => {
    const distance = calculateDistanceMeters(25.033, 121.5654, 25.034, 121.5654);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(130);
  });
});
