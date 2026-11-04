import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Language, ReligiousOrganization } from '../types';
import { getGoogleMapsUrl } from '../utils/geo';
import { religionLabels, translations } from '../utils/i18n';
import { CulturalRouteMapLayer, hasUsableMapCoordinates } from '../features/cultural-routes/CulturalRouteMapLayer';

export type MapFocusRequest = {
  organization: ReligiousOrganization;
  token: number;
  relatedOrganizations?: ReligiousOrganization[];
  temporary?: boolean;
};

type Props = {
  items: ReligiousOrganization[];
  language: Language;
  onExplore: (organization: ReligiousOrganization, restoreFocus?: () => void) => void;
  userLocation?: { latitude: number; longitude: number };
  routeStops?: ReligiousOrganization[];
  selectedRouteStopId?: string;
  onRouteStopSelect?: (organizationId: string) => void;
  focusRequest?: MapFocusRequest;
  visible?: boolean;
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

export function ReligiousOrganizationMap({ items, language, userLocation, onExplore, routeStops, selectedRouteStopId, onRouteStopSelect, focusRequest, visible = true }: Props) {
  const routeActive = !!routeStops && routeStops.length >= 2 && routeStops.every(hasUsableMapCoordinates)
    && new Set(routeStops.map(stop => stop.id)).size === routeStops.length;
  const focusedOrganizations = getFocusedOrganizations(focusRequest, routeActive);
  const focusKey = JSON.stringify(focusedOrganizations.map(organization => organization.id));
  const clusteredItems = useMemo(() => {
    if (!focusedOrganizations.length) return items;
    const focusedIds = new Set(focusedOrganizations.map(organization => organization.id));
    return items.filter(organization => !focusedIds.has(organization.id));
  }, [items, focusKey]);
  return (
    <div className="map-shell">
      <MapContainer center={TAIPEI_CENTER} zoom={12} scrollWheelZoom className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusteredMarkers items={clusteredItems} language={language} onExplore={onExplore} hidden={routeActive} />
        <UserLocationMarker location={userLocation} language={language} />
        <CulturalRouteMapLayer stops={routeActive ? routeStops : undefined} selectedStopId={selectedRouteStopId} language={language} onSelectStop={onRouteStopSelect} />
        <FocusedOrganizationMarker request={focusRequest} suspended={routeActive} language={language} onExplore={onExplore} />
        <MapVisibility visible={visible} />
      </MapContainer>
      {routeActive
        ? <p className="route-marker-legend">{language === 'zh' ? '編號表示停靠順序，並非實際步行路徑。' : 'Numbers show stop order, not an actual walking path.'}</p>
        : focusRequest?.temporary
          ? <p className="route-marker-legend">{currentLocationNotice(language)}</p>
        : <MapLegend language={language} />}
    </div>
  );
}

function ClusteredMarkers({ items, language, onExplore, hidden }: Pick<Props, 'items' | 'language' | 'onExplore'> & { hidden?: boolean }) {
  const map = useMap();
  const markersById = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    if (hidden) return;
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 48,
      showCoverageOnHover: false,
    });

    const markers = new Map<string, L.Marker>();
    for (const item of items) {
      const marker = L.marker([item.latitude, item.longitude], {
        icon: createMarkerIcon(item.religion),
        title: item.name,
      });
      marker.bindPopup(renderPopup(item, language), { maxWidth: 280 });
      markers.set(item.id, marker);
      cluster.addLayer(marker);
    }
    markersById.current = markers;

    map.addLayer(cluster);
    const container = map.getContainer();
    const organizationsById = new Map(items.map(item => [item.id, item]));
    const handleExplore = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-faith-organization]') : null;
      if (!target || !container.contains(target)) return;
      const organization = organizationsById.get(target.dataset.faithOrganization ?? '');
      if (organization) {
        target.focus();
        onExplore(organization, () => {
          // Language changes can replace Leaflet's popup DOM while the scene is open.
          if (target.isConnected) { target.focus({ preventScroll: true }); return; }
          const currentMarker = markersById.current.get(organization.id);
          const popup = currentMarker?.getPopup();
          if (currentMarker && popup) {
            const autoPan = popup.options.autoPan;
            popup.options.autoPan = false;
            currentMarker.openPopup();
            popup.options.autoPan = autoPan;
            const button = popup.getElement()?.querySelector<HTMLButtonElement>('button[data-faith-organization]');
            if (button) { button.focus({ preventScroll: true }); return; }
          }
          container.focus({ preventScroll: true });
        });
      }
    };
    container.addEventListener('click', handleExplore);
    return () => {
      container.removeEventListener('click', handleExplore);
      if (markersById.current === markers) markersById.current = new Map();
      map.removeLayer(cluster);
    };
  }, [items, language, map, onExplore, hidden]);

  return null;
}

function MapVisibility({ visible }: { visible: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [map, visible]);
  return null;
}

function getFocusedOrganizations(request: MapFocusRequest | undefined, suspended: boolean) {
  return !suspended && request && hasUsableMapCoordinates(request.organization)
    ? [request.organization, ...(request.relatedOrganizations ?? [])]
      .filter((organization, index, group) => hasUsableMapCoordinates(organization) && group.findIndex(item => item.id === organization.id) === index)
    : [];
}

function FocusedOrganizationMarker({ request, suspended, language, onExplore }: { request?: MapFocusRequest; suspended: boolean; language: Language; onExplore: Props['onExplore'] }) {
  const map = useMap();
  const markers = useRef(new Map<string, L.Marker>());
  const previousView = useRef<{ center: L.LatLng; zoom: number } | undefined>(undefined);
  const lastViewRequest = useRef<number | undefined>(undefined);
  const lastFocusRequest = useRef<number | undefined>(undefined);
  const token = request?.token;
  const temporary = !!request?.temporary;
  const organizations = getFocusedOrganizations(request, suspended);
  const groupKey = JSON.stringify(organizations.map(organization => [organization.id, organization.latitude, organization.longitude]));
  const contentKey = JSON.stringify(organizations.map(organization => [organization.name, organization.address, organization.district, organization.village, organization.phone, organization.religion, organization.festivalDates]));

  // Restore before the route layer's passive effects capture and fit their view.
  useLayoutEffect(() => {
    const activeTemporaryRequest = organizations.length > 0 && temporary;
    if (previousView.current && !activeTemporaryRequest) {
      const previous = previousView.current;
      previousView.current = undefined;
      map.setView(previous.center, previous.zoom, { animate: false });
    }
  }, [map, groupKey, temporary]);

  // Apply after route exit restores its view. Only an explicit new request may fit.
  useEffect(() => {
    if (!organizations.length || token === lastViewRequest.current) return;
    if (temporary && !previousView.current) previousView.current = { center: map.getCenter(), zoom: map.getZoom() };
    map.invalidateSize({ pan: false });
    if (organizations.length > 1) map.fitBounds(organizations.map(organization => [organization.latitude, organization.longitude] as [number, number]), { padding: [32, 32], maxZoom: 16, animate: false });
    else map.setView([organizations[0].latitude, organizations[0].longitude], Math.max(map.getZoom(), 15), { animate: false });
    lastViewRequest.current = token;
  }, [map, groupKey, token, temporary]);

  useEffect(() => {
    const entries = new Map<string, L.Marker>();
    for (const organization of organizations) {
      const marker = L.marker([organization.latitude, organization.longitude], { icon: createMarkerIcon(organization.religion), title: organization.name, keyboard: true });
      marker.addTo(map);
      entries.set(organization.id, marker);
    }
    markers.current = entries;
    return () => {
      for (const marker of entries.values()) marker.removeFrom(map);
      if (markers.current === entries) markers.current = new Map();
    };
  }, [map, groupKey]);

  useEffect(() => {
    const cleanup: (() => void)[] = [];
    organizations.forEach((organization, index) => {
      const marker = markers.current.get(organization.id);
      if (!marker) return;
      const label = temporary ? `${currentLocationLabel(language)}: ${organization.name}` : organization.name;
      marker.getElement()?.setAttribute('aria-label', label);
      marker.getElement()?.setAttribute('title', label);
      const content = document.createElement('div');
      content.innerHTML = renderPopup(organization, language, temporary);
      const button = content.querySelector<HTMLButtonElement>('button[data-faith-organization]');
      const openSpace = (event: MouseEvent) => {
        // Do not also invoke the ordinary clustered-popup delegation bridge.
        event.stopPropagation();
        button?.focus();
        onExplore(organization, () => {
          const currentMarker = markers.current.get(organization.id);
          currentMarker?.openPopup();
          currentMarker?.getPopup()?.getElement()?.querySelector<HTMLButtonElement>('button[data-faith-organization]')?.focus({ preventScroll: true });
        });
      };
      button?.addEventListener('click', openSpace);
      cleanup.push(() => button?.removeEventListener('click', openSpace));
      marker.bindPopup(content, { maxWidth: 280, autoPan: false });
      if (index === 0) {
        marker.openPopup();
        if (token !== lastFocusRequest.current) {
          button?.focus({ preventScroll: true });
          lastFocusRequest.current = token;
        }
      }
    });
    return () => {
      for (const removeListener of cleanup) removeListener();
    };
  }, [map, groupKey, contentKey, language, temporary, onExplore, token]);
  return null;
}

function currentLocationLabel(language: Language) {
  return language === 'zh' ? '目前登記位置' : 'Current registered location';
}

function currentLocationNotice(language: Language) {
  return language === 'zh'
    ? '標記為目前登記位置，並非經查證的歷史座標；不代表該團體當時已位於此處。'
    : 'Markers show current registered locations, not verified historical coordinates. They do not establish that the organization occupied this site at the time.';
}

function UserLocationMarker({
  location,
  language,
}: {
  location?: { latitude: number; longitude: number };
  language: Language;
}) {
  const map = useMap();
  const markerRef = useRef<L.CircleMarker | null>(null);
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return undefined;
    const marker = L.circleMarker([latitude, longitude], {
      radius: 9,
      color: '#0f766e',
      fillColor: '#14b8a6',
      fillOpacity: 0.9,
      weight: 3,
    });
    markerRef.current = marker;
    marker.addTo(map);
    map.setView([latitude, longitude], 15);

    return () => {
      marker.removeFrom(map);
      if (markerRef.current === marker) markerRef.current = null;
    };
  }, [latitude, longitude, map]);

  useEffect(() => {
    markerRef.current?.bindPopup(translations[language].userLocation);
  }, [language, latitude, longitude]);

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

function renderPopup(item: ReligiousOrganization, language: Language, currentLocation = false) {
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
      ${currentLocation ? `<p class="popup-location-note">${escapeHtml(currentLocationNotice(language))}</p>` : ''}
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
      <button type="button" class="primary-button popup-explore" data-faith-organization="${escapeHtml(item.id)}">${escapeHtml(t.exploreFaithSpace)}</button>
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
