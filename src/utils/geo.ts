import proj4 from 'proj4';

export const TAIPEI_BOUNDS = {
  minLng: 121.43,
  maxLng: 121.7,
  minLat: 24.9,
  maxLat: 25.25,
};

proj4.defs(
  'EPSG:3826',
  '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs',
);

export function convertTwd97ToWgs84(x: number, y: number): {
  longitude: number;
  latitude: number;
} {
  const [longitude, latitude] = proj4('EPSG:3826', 'EPSG:4326', [x, y]);
  return { longitude, latitude };
}

export function isCoordinateOutlier(longitude: number, latitude: number): boolean {
  return (
    longitude < TAIPEI_BOUNDS.minLng ||
    longitude > TAIPEI_BOUNDS.maxLng ||
    latitude < TAIPEI_BOUNDS.minLat ||
    latitude > TAIPEI_BOUNDS.maxLat
  );
}

export function calculateDistanceMeters(
  userLat: number,
  userLng: number,
  itemLat: number,
  itemLng: number,
): number {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(itemLat - userLat);
  const deltaLng = toRadians(itemLng - userLng);
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(itemLat);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

export function formatDistance(distanceMeters: number, language: 'zh' | 'en'): string {
  if (distanceMeters < 1000) {
    return language === 'zh'
      ? `${Math.round(distanceMeters)} 公尺`
      : `${Math.round(distanceMeters)} m`;
  }

  const kilometers = distanceMeters / 1000;
  return language === 'zh' ? `${kilometers.toFixed(1)} 公里` : `${kilometers.toFixed(1)} km`;
}

export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
