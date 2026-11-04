import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Filters,
  Language,
  NearbyResult,
  ReligiousOrganization,
} from './types';
import { Dashboard } from './components/Dashboard';
import { DisclaimerNotice } from './components/DisclaimerNotice';
import { FilterPanel } from './components/FilterPanel';
import { Footer } from './components/Footer';
import { LanguageToggle } from './components/LanguageToggle';
import { NearbyPanel } from './components/NearbyPanel';
import { ReligiousOrganizationList } from './components/ReligiousOrganizationList';
import { ReligiousOrganizationMap } from './components/ReligiousOrganizationMap';
import { ExplorationBoundary } from './components/ExplorationBoundary';
import type { ResolvedCulturalRoute } from './features/cultural-routes/routeTypes';
import { FaithSpaceBoundary, FaithSpaceStatus } from './features/faith-spaces/FaithSpaceLoader';
import { getPublicAssetPath } from './utils/assets';
import { calculateDistanceMeters } from './utils/geo';
import { buildSummary, filterOrganizations } from './utils/data';
import { getStoredLanguage, translations } from './utils/i18n';

const radiusOptions = [500, 1000, 2000, 5000];
const FaithSpaceModal = lazy(() => import('./features/faith-spaces/FaithSpaceModal'));
const ReligiousCalendar = lazy(() => import('./features/religious-calendar/ReligiousCalendar'));
const CulturalRoutes = lazy(() => import('./features/cultural-routes/CulturalRoutesPanel'));
type ExplorationMode = 'map' | 'calendar' | 'routes';

const explorationLabels = {
  zh: { navigation: '探索台北信仰文化', map: '地圖', calendar: '行事曆', routes: '散步路線', loading: '載入探索內容…', focused: '地圖查看：', clearFocus: '取消場所標示', routeMap: '路線停靠點地圖', ordinaryMap: '宗教團體地圖', overview: '目前的地圖篩選已保留，路線停靠點獨立顯示。', viewRouteMap: '查看路線地圖', readStop: '閱讀此站文化介紹', selectedStop: '目前停留點' },
  en: { navigation: 'Explore Taipei faith and culture', map: 'Map', calendar: 'Calendar', routes: 'Walking Routes', loading: 'Loading discovery content…', focused: 'Viewing on map: ', clearFocus: 'Clear place highlight', routeMap: 'Route stop map', ordinaryMap: 'Religious organizations map', overview: 'Your map filters are preserved. Route stops are shown independently.', viewRouteMap: 'View route map', readStop: 'Read this stop’s cultural details', selectedStop: 'Selected stop' },
};

export function App() {
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage());
  const [organizations, setOrganizations] = useState<ReligiousOrganization[]>([]);
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(getStoredLanguage()));
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();
  const [nearbyError, setNearbyError] = useState<string>();
  const [dataLoadError, setDataLoadError] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<ReligiousOrganization>();
  const [mode, setMode] = useState<ExplorationMode>('map');
  const [visited, setVisited] = useState({ calendar: false, routes: false });
  const [selectedRoute, setSelectedRoute] = useState<ResolvedCulturalRoute>();
  const [selectedRouteStopId, setSelectedRouteStopId] = useState<string>();
  const [focusRequest, setFocusRequest] = useState<{ organization: ReligiousOrganization; token: number }>();
  const focusSequence = useRef(0);
  const workspaceRef = useRef<HTMLElement>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const routeGuideRef = useRef<HTMLDivElement>(null);
  const selectRoute = useCallback((route: ResolvedCulturalRoute | undefined) => {
    setSelectedRoute(route);
    setSelectedRouteStopId(route?.organizations[0]?.id);
  }, []);
  const navigate = useCallback((nextMode: ExplorationMode) => {
    setMode(nextMode);
    if (nextMode !== 'map') setFocusRequest(undefined);
    if (nextMode !== 'map') setVisited(current => ({ ...current, [nextMode]: true }));
  }, []);
  const viewOnMap = useCallback((organization: ReligiousOrganization) => {
    setMode('map');
    setFocusRequest({ organization, token: ++focusSequence.current });
    requestAnimationFrame(() => workspaceRef.current?.scrollIntoView?.({ block: 'start' }));
  }, []);
  const exitRoute = useCallback(() => {
    setSelectedRoute(undefined);
    setSelectedRouteStopId(undefined);
    setMode('map');
    requestAnimationFrame(() => {
      mapPanelRef.current?.scrollIntoView?.({ block: 'start' });
      mapPanelRef.current?.focus({ preventScroll: true });
    });
  }, []);
  const returnFocus = useRef<(() => void) | undefined>(undefined);
  const openFaithSpace = useCallback((organization: ReligiousOrganization, restoreFocus?: () => void) => {
    const invokingControl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    returnFocus.current = restoreFocus ?? (() => invokingControl?.focus({ preventScroll: true }));
    setSelectedOrganization(organization);
  }, []);
  const closeFaithSpace = useCallback(() => {
    setSelectedOrganization(undefined);
    requestAnimationFrame(() => returnFocus.current?.());
  }, []);

  const t = translations[language];
  const discovery = explorationLabels[language];
  const activeRouteStop = selectedRoute?.organizations.find(organization => organization.id === selectedRouteStopId);

  useEffect(() => {
    localStorage.setItem('taipei-faith-map-language', language);
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  }, [language]);

  useEffect(() => {
    loadAppData(import.meta.env.BASE_URL)
      .then((items) => {
        setDataLoadError(false);
        setOrganizations(items);
      })
      .catch(() => {
        setDataLoadError(true);
        setOrganizations([]);
      });
  }, []);

  const filteredOrganizations = useMemo(
    () => filterOrganizations(organizations, filters),
    [organizations, filters],
  );

  const filteredSummary = useMemo(() => buildSummary(filteredOrganizations), [filteredOrganizations]);

  const districts = useMemo(
    () => [...new Set(organizations.map((item) => item.district))].sort((a, b) => a.localeCompare(b, 'zh-Hant')),
    [organizations],
  );

  const villages = useMemo(() => {
    const scoped = filters.district
      ? organizations.filter((item) => item.district === filters.district)
      : organizations;
    return [...new Set(scoped.map((item) => item.village).filter(Boolean) as string[])].sort((a, b) =>
      a.localeCompare(b, 'zh-Hant'),
    );
  }, [filters.district, organizations]);

  const nearbyResults = useMemo<NearbyResult[]>(() => {
    if (!userLocation) return [];
    return filteredOrganizations
      .map((item) => ({
        ...item,
        distanceMeters: calculateDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          item.latitude,
          item.longitude,
        ),
      }))
      .filter((item) => item.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 30);
  }, [filteredOrganizations, radiusMeters, userLocation]);

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setFilters((current) => {
      if (current.religion !== '全部' && current.religion !== 'All') return current;
      const religion = nextLanguage === 'zh' ? '全部' : 'All';
      return current.religion === religion ? current : { ...current, religion };
    });
  };

  const handleNearby = () => {
    setNearbyError(undefined);
    if (!navigator.geolocation) {
      setNearbyError(language === 'zh' ? '此瀏覽器不支援定位功能。' : 'Geolocation is not available.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setNearbyError(language === 'zh' ? '無法取得目前位置。' : 'Unable to get your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <>
    <div className="app" inert={selectedOrganization ? true : undefined}>
      <header className="app-header">
        <div>
          <p className="eyebrow">Open Data Map</p>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
        <LanguageToggle language={language} onChange={handleLanguageChange} />
      </header>

      <nav className="discovery-navigation" aria-label={discovery.navigation}>
        {(['map', 'calendar', 'routes'] as const).map(item => <button key={item} type="button" aria-current={mode === item ? 'page' : undefined} onClick={() => navigate(item)}>{discovery[item]}</button>)}
      </nav>

      <main>
        {dataLoadError ? <p className="status-text">{t.dataLoadError}</p> : null}
        {visited.calendar && <div hidden={mode !== 'calendar'} className="calendar-workspace">
          <ExplorationBoundary language={language} onReturnMap={() => navigate('map')}>
            <Suspense fallback={<p role="status">{discovery.loading}</p>}><ReligiousCalendar organizations={organizations} language={language} onViewMap={viewOnMap} onExplore={openFaithSpace} /></Suspense>
          </ExplorationBoundary>
        </div>}
        <section className={`workspace${mode === 'routes' ? ' route-workspace' : ''}`} hidden={mode === 'calendar'} aria-label={t.appTitle} ref={workspaceRef}>
          <div className="exploration-sidebar">
          <div hidden={mode !== 'map'}>
          <FilterPanel
            districts={districts}
            filters={filters}
            language={language}
            resultCount={filteredOrganizations.length}
            setFilters={setFilters}
            villages={villages}
          />
          </div>
          {visited.routes && <div hidden={mode !== 'routes'} ref={routeGuideRef}>
            <button className="text-button route-map-shortcut" aria-controls="faith-main-map" onClick={() => {
              mapPanelRef.current?.scrollIntoView?.({ block: 'start' });
              mapPanelRef.current?.focus({ preventScroll: true });
            }}>{discovery.viewRouteMap}</button>
            <ExplorationBoundary language={language} onReturnMap={() => navigate('map')}>
              <Suspense fallback={<p role="status">{discovery.loading}</p>}><CulturalRoutes organizations={organizations} language={language}
                selectedRoute={selectedRoute} selectedStopId={selectedRouteStopId} onSelectRoute={selectRoute} onSelectStop={setSelectedRouteStopId}
                onExplore={openFaithSpace} onExit={exitRoute} /></Suspense>
            </ExplorationBoundary>
          </div>}
          </div>
          <div className="map-column" id="faith-main-map" role="region" aria-label={mode === 'routes' ? discovery.routeMap : discovery.ordinaryMap} ref={mapPanelRef} tabIndex={-1}>
            {mode === 'routes' && selectedRoute && <p className="discovery-map-note">{discovery.overview}</p>}
            {mode === 'map' && focusRequest && <div className="discovery-focused-place"><p>{discovery.focused}<strong>{focusRequest.organization.name}</strong></p><button className="text-button" onClick={() => setFocusRequest(undefined)}>{discovery.clearFocus}</button></div>}
            <h2 className="visually-hidden">{mode === 'routes' ? discovery.routeMap : discovery.ordinaryMap}</h2>
            <ReligiousOrganizationMap
              items={filteredOrganizations}
              language={language}
              userLocation={userLocation}
              onExplore={openFaithSpace}
              visible={mode !== 'calendar'}
              routeStops={mode === 'routes' ? selectedRoute?.organizations : undefined}
              selectedRouteStopId={selectedRouteStopId}
              onRouteStopSelect={setSelectedRouteStopId}
              focusRequest={mode === 'map' ? focusRequest : undefined}
            />
            {mode === 'routes' && activeRouteStop && <section className="route-map-selection" aria-label={discovery.selectedStop}>
              <p className="eyebrow">{discovery.selectedStop} · {(selectedRoute?.organizations.indexOf(activeRouteStop) ?? 0) + 1} / {selectedRoute?.organizations.length}</p>
              <h3>{activeRouteStop.name}</h3><p>{activeRouteStop.address}</p>
              <button className="text-button" onClick={() => {
                const details = routeGuideRef.current?.querySelector<HTMLElement>('.route-stop-detail');
                details?.scrollIntoView?.({ block: 'center' });
                details?.focus({ preventScroll: true });
              }}>{discovery.readStop}</button>
            </section>}
            <div hidden={mode !== 'map'}>
            <NearbyPanel
              error={nearbyError}
              language={language}
              onNearby={handleNearby}
              onRadiusChange={setRadiusMeters}
              radiusMeters={radiusMeters}
              radiusOptions={radiusOptions}
              results={nearbyResults}
            />
            </div>
          </div>
        </section>

        <div hidden={mode !== 'map'} className="map-records">
        <Dashboard language={language} summary={filteredSummary} />
        <ReligiousOrganizationList items={filteredOrganizations} language={language} onExplore={openFaithSpace} />
        </div>
        <DisclaimerNotice language={language} />
      </main>

      <Footer language={language} />
    </div>
    {selectedOrganization && <FaithSpaceBoundary language={language} onClose={closeFaithSpace}><Suspense fallback={<FaithSpaceStatus language={language} onClose={closeFaithSpace} />}>
      <FaithSpaceModal organization={selectedOrganization} language={language} onLanguageChange={handleLanguageChange} onClose={closeFaithSpace} />
    </Suspense></FaithSpaceBoundary>}
    </>
  );
}

function loadAppData(baseUrl: string): Promise<ReligiousOrganization[]> {
  return fetchJson<ReligiousOrganization[]>(
    getPublicAssetPath(withCacheBust('data/religious-organizations.json'), baseUrl),
  );
}

function withCacheBust(path: string): string {
  return `${path}?v=${Date.now()}`;
}

function defaultFilters(language: Language): Filters {
  return {
    religion: language === 'zh' ? '全部' : 'All',
    district: '',
    village: '',
    hasFestivalDate: false,
    search: '',
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
