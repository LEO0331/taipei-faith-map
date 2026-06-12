import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Language, ReligiousOrganization } from '../types';
import { getGoogleMapsUrl } from '../utils/geo';
import { religionLabels, translations } from '../utils/i18n';

type Props = {
  items: ReligiousOrganization[];
  language: Language;
  userLocation?: { latitude: number; longitude: number };
};

const TAIPEI_CENTER: [number, number] = [25.0478, 121.5319];

const religionColors: Record<string, string> = {
  道教: '#b45309',
  佛教: '#ca8a04',
  基督教: '#2563eb',
  天主教: '#1d4ed8',
  一貫道: '#7c3aed',
  回教: '#059669',
  天德教: '#be185d',
  軒轅教: '#9333ea',
  理教: '#0891b2',
  巴哈伊教: '#0f766e',
  天理教: '#c2410c',
  其他: '#64748b',
  未分類: '#374151',
};

export function ReligiousOrganizationMap({ items, language, userLocation }: Props) {
  return (
    <div className="map-shell">
      <MapContainer center={TAIPEI_CENTER} zoom={12} scrollWheelZoom className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusteredMarkers items={items} language={language} />
        <UserLocationMarker location={userLocation} language={language} />
      </MapContainer>
      <MapLegend language={language} />
    </div>
  );
}

function ClusteredMarkers({ items, language }: { items: ReligiousOrganization[]; language: Language }) {
  const map = useMap();

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 48,
      showCoverageOnHover: false,
    });

    for (const item of items) {
      const marker = L.marker([item.latitude, item.longitude], {
        icon: createMarkerIcon(item.religion),
        title: item.name,
      });
      marker.bindPopup(renderPopup(item, language), { maxWidth: 280 });
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [items, language, map]);

  return null;
}

function UserLocationMarker({
  location,
  language,
}: {
  location?: { latitude: number; longitude: number };
  language: Language;
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return undefined;
    const marker = L.circleMarker([location.latitude, location.longitude], {
      radius: 9,
      color: '#0f766e',
      fillColor: '#14b8a6',
      fillOpacity: 0.9,
      weight: 3,
    }).bindPopup(translations[language].userLocation);
    marker.addTo(map);
    map.setView([location.latitude, location.longitude], 15);

    return () => {
      marker.removeFrom(map);
    };
  }, [language, location, map]);

  return null;
}

function createMarkerIcon(religion: string) {
  const color = religionColors[religion] ?? religionColors['未分類'];
  return L.divIcon({
    className: 'faith-marker',
    html: `<span style="background:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });
}

function renderPopup(item: ReligiousOrganization, language: Language) {
  const t = translations[language];
  const rows = [
    [t.religion, religionLabels[language][item.religion]],
    [t.district, item.district],
    [t.village, item.village],
    [t.address, item.address],
    [t.phone, item.phone],
  ].filter(([, value]) => value);
  const festivals = item.festivalDates
    .map((date) => `<span class="popup-chip">${escapeHtml(date)}</span>`)
    .join('');

  return `
    <article class="map-popup">
      <h3>${escapeHtml(item.name)}</h3>
      ${rows
        .map(
          ([label, value]) =>
            `<p><strong>${escapeHtml(label ?? '')}</strong><span>${escapeHtml(value ?? '')}</span></p>`,
        )
        .join('')}
      ${
        festivals
          ? `<div class="popup-festivals"><strong>${escapeHtml(t.festivalDates)}</strong><div>${festivals}</div></div>`
          : ''
      }
      <a href="${getGoogleMapsUrl(item.latitude, item.longitude)}" target="_blank" rel="noreferrer">
        ${escapeHtml(t.openGoogleMaps)}
      </a>
    </article>
  `;
}

function MapLegend({ language }: { language: Language }) {
  const visibleReligions = ['道教', '佛教', '基督教', '天主教', '一貫道', '回教', '其他', '未分類'] as const;
  return (
    <div className="map-legend" aria-label={translations[language].religion}>
      {visibleReligions.map((religion) => (
        <span key={religion}>
          <i style={{ background: religionColors[religion] }} />
          {religionLabels[language][religion]}
        </span>
      ))}
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[char];
  });
}
