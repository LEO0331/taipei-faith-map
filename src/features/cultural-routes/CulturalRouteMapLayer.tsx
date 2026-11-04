import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import type { Language, ReligiousOrganization } from '../../types';
import { isCoordinateOutlier } from '../../utils/geo';

type Props = {
  stops?: ReligiousOrganization[];
  selectedStopId?: string;
  language: Language;
  onSelectStop?: (organizationId: string) => void;
};

export function hasUsableMapCoordinates(organization: ReligiousOrganization) {
  return Number.isFinite(organization.latitude) && Number.isFinite(organization.longitude)
    && !isCoordinateOutlier(organization.longitude, organization.latitude);
}

/** Ordered locations only: no line here represents a pedestrian route. */
export function CulturalRouteMapLayer({ stops, selectedStopId, language, onSelectStop }: Props) {
  const map = useMap();
  const markers = useRef(new Map<string, { marker: L.Marker; index: number; organization: ReligiousOrganization }>());
  const regularView = useRef<{ center: L.LatLng; zoom: number } | undefined>(undefined);
  const selection = useRef(onSelectStop);
  selection.current = onSelectStop;
  const validStops = stops && stops.length >= 2 && stops.every(hasUsableMapCoordinates)
    && new Set(stops.map(stop => stop.id)).size === stops.length ? stops : [];
  const stopKey = JSON.stringify(validStops.map(stop => [stop.id, stop.latitude, stop.longitude]));

  useEffect(() => {
    if (validStops.length) {
      if (!regularView.current) regularView.current = { center: map.getCenter(), zoom: map.getZoom() };
      map.invalidateSize({ pan: false });
      map.fitBounds(validStops.map(stop => [stop.latitude, stop.longitude] as [number, number]), { padding: [32, 32], maxZoom: 16, animate: false });
    } else if (regularView.current) {
      const previous = regularView.current;
      regularView.current = undefined;
      map.setView(previous.center, previous.zoom, { animate: false });
    }
    // The identity key deliberately excludes language and current stop selection.
  }, [map, stopKey]);

  useEffect(() => {
    const entries = new Map<string, { marker: L.Marker; index: number; organization: ReligiousOrganization }>();
    validStops.forEach((organization, index) => {
      const marker = L.marker([organization.latitude, organization.longitude], {
        icon: routeIcon(index, false), keyboard: true,
      });
      marker.on('click', () => selection.current?.(organization.id));
      marker.addTo(map);
      entries.set(organization.id, { marker, index, organization });
    });
    markers.current = entries;
    return () => {
      for (const { marker } of entries.values()) marker.removeFrom(map);
      if (markers.current === entries) markers.current = new Map();
    };
  }, [map, stopKey]);

  useEffect(() => {
    for (const { marker, index, organization } of markers.current.values()) {
      const selected = selectedStopId === organization.id;
      marker.setIcon(routeIcon(index, selected));
      const label = language === 'zh'
        ? `第 ${index + 1}／${validStops.length} 站：${organization.name}`
        : `Stop ${index + 1} of ${validStops.length}: ${organization.name}`;
      const element = marker.getElement();
      element?.setAttribute('aria-label', label);
      element?.setAttribute('title', label);
      element?.setAttribute('aria-pressed', String(selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
    }
  }, [language, selectedStopId, stopKey]);

  return null;
}

function routeIcon(index: number, selected: boolean) {
  const number = document.createElement('span');
  number.textContent = String(index + 1);
  number.style.cssText = `display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:3px solid ${selected ? '#fff4d3' : '#fff'};background:${selected ? '#7e382b' : '#254b45'};color:#fff;font:700 16px system-ui;box-shadow:0 0 0 ${selected ? '4px #7e382b' : '1px #254b45'},0 3px 10px #0004;`;
  return L.divIcon({ className: 'cultural-route-marker', html: number, iconSize: [44, 44], iconAnchor: [22, 22] });
}
