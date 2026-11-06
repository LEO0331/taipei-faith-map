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
import type { MapFocusRequest } from './components/ReligiousOrganizationMap';
import { ExplorationBoundary } from './components/ExplorationBoundary';
import type { ResolvedCulturalRoute } from './features/cultural-routes/routeTypes';
import type { RelatedCulturalTarget, RelatedSelectionRequest } from './components/relatedContentTypes';
import { FaithSpaceBoundary, FaithSpaceStatus } from './features/faith-spaces/FaithSpaceLoader';
import { getPublicAssetPath } from './utils/assets';
import { calculateDistanceMeters } from './utils/geo';
import { buildSummary, filterOrganizations } from './utils/data';
import { getStoredLanguage, translations } from './utils/i18n';
import { getFeatureFlags } from './utils/featureFlags';
import { QuietGardenBoundary, QuietGardenStatus } from './features/quiet-presence/QuietGardenLoader';

const radiusOptions = [500, 1000, 2000, 5000];
const FaithSpaceModal = lazy(() => import('./features/faith-spaces/FaithSpaceModal'));
const ReligiousCalendar = lazy(() => import('./features/religious-calendar/ReligiousCalendar'));
const CulturalRoutes = lazy(() => import('./features/cultural-routes/CulturalRoutesPanel'));
const HeritageExplorer = lazy(() => import('./features/heritage/HeritageExplorer'));
const QuietGardenDialog = lazy(() => import('./features/quiet-presence/QuietGardenDialog'));
type ExplorationMode = 'map' | 'calendar' | 'routes' | 'heritage';
type HeritageReturnContext = { control: HTMLElement | null; kind: 'map' | 'route'; controlKey: string; previousRoute?: ResolvedCulturalRoute; previousStopId?: string };
type RelatedReturnContext = { organization: ReligiousOrganization; mode: ExplorationMode; route?: ResolvedCulturalRoute; stopId?: string; focus?: MapFocusRequest; heritage?: HeritageReturnContext; restoreFocus?: () => void; invokerAction: 'explore' | 'profile' };

const explorationLabels = {
  zh: { navigation: '探索台北信仰文化', map: '地圖', calendar: '行事曆', routes: '散步路線', heritage: '歷史與故事', loading: '載入探索內容…', focused: '地圖查看：', clearFocus: '取消場所標示', routeMap: '路線停靠點地圖', ordinaryMap: '宗教團體地圖', overview: '目前的地圖篩選已保留，路線停靠點獨立顯示。', viewRouteMap: '查看路線地圖', readStop: '閱讀此站文化介紹', selectedStop: '目前停留點', returnHeritage: '返回歷史與故事', currentLocations: '目前登記位置，並非經查證的歷史座標。', routeUnavailable: '相關路線目前無法載入或核對，請稍後再試。' },
  en: { navigation: 'Explore Taipei faith and culture', map: 'Map', calendar: 'Calendar', routes: 'Walking Routes', heritage: 'History & Stories', loading: 'Loading discovery content…', focused: 'Viewing on map: ', clearFocus: 'Clear place highlight', routeMap: 'Route stop map', ordinaryMap: 'Religious organizations map', overview: 'Your map filters are preserved. Route stops are shown independently.', viewRouteMap: 'View route map', readStop: 'Read this stop’s cultural details', selectedStop: 'Selected stop', returnHeritage: 'Return to History & Stories', currentLocations: 'Current registered locations, not verified historical coordinates.', routeUnavailable: 'The related route could not be loaded or verified. Please try again later.' },
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
  const [gardenOpen, setGardenOpen] = useState(false);
  const gardenInvoker = useRef<HTMLElement | null>(null);
  const flags = getFeatureFlags();
  const closeGarden = useCallback(() => {
    setGardenOpen(false);
    requestAnimationFrame(() => gardenInvoker.current?.focus());
  }, []);
  const [faithSpacePanel, setFaithSpacePanel] = useState<'scene' | 'place'>('scene');
  const [relatedSelection, setRelatedSelection] = useState<RelatedSelectionRequest>();
  const [hasRelatedReturn, setHasRelatedReturn] = useState(false);
  const relatedOrigin = useRef<RelatedReturnContext | undefined>(undefined);
  const relatedSequence = useRef(0);
  const [mode, setMode] = useState<ExplorationMode>('map');
  const [visited, setVisited] = useState({ calendar: false, routes: false, heritage: false });
  const [selectedRoute, setSelectedRoute] = useState<ResolvedCulturalRoute>();
  const [selectedRouteStopId, setSelectedRouteStopId] = useState<string>();
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest>();
  const heritageReturn = useRef<HeritageReturnContext | undefined>(undefined);
  const [hasHeritageReturn, setHasHeritageReturn] = useState(false);
  const [heritageRouteError, setHeritageRouteError] = useState(false);
  const heritageRouteRequest = useRef(0);
  const focusSequence = useRef(0);
  const workspaceRef = useRef<HTMLElement>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const routeGuideRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const heritageGuideRef = useRef<HTMLDivElement>(null);
  const selectRoute = useCallback((route: ResolvedCulturalRoute | undefined) => {
    setSelectedRoute(route);
    setSelectedRouteStopId(route?.organizations[0]?.id);
  }, []);
  const returnToHeritage = useCallback(() => {
    const context = heritageReturn.current;
    heritageReturn.current = undefined;
    setHasHeritageReturn(false);
    setFocusRequest(undefined);
    if (context?.kind === 'route') {
      setSelectedRoute(context.previousRoute);
      setSelectedRouteStopId(context.previousStopId);
    }
    setMode('heritage');
    requestAnimationFrame(() => {
      if (context?.control?.isConnected) { context.control.focus(); return; }
      if (!context) return;
      const attribute = context.kind === 'map' ? 'data-view-current-organizations' : 'data-open-cultural-route';
      [...(heritageGuideRef.current?.querySelectorAll<HTMLElement>(`[${attribute}]`) ?? [])]
        .find(element => element.getAttribute(attribute) === context.controlKey)?.focus();
    });
  }, []);
  const navigate = useCallback((nextMode: ExplorationMode) => {
    ++relatedSequence.current;
    relatedOrigin.current = undefined;
    setHasRelatedReturn(false); setRelatedSelection(undefined);
    ++heritageRouteRequest.current;
    setHeritageRouteError(false);
    if (nextMode === 'heritage' && heritageReturn.current) { returnToHeritage(); return; }
    if (heritageReturn.current) setFocusRequest(undefined);
    heritageReturn.current = undefined;
    setHasHeritageReturn(false);
    setMode(nextMode);
    if (nextMode !== 'map') setFocusRequest(undefined);
    if (nextMode !== 'map') setVisited(current => ({ ...current, [nextMode]: true }));
  }, [returnToHeritage]);
  const viewOnMap = useCallback((organization: ReligiousOrganization) => {
    setMode('map');
    setFocusRequest({ organization, token: ++focusSequence.current, ...(relatedOrigin.current ? { temporary: true, historical: false } : {}) });
    requestAnimationFrame(() => workspaceRef.current?.scrollIntoView?.({ block: 'start' }));
  }, []);
  const viewHeritagePlaces = useCallback((places: ReligiousOrganization[]) => {
    if (!places.length) return;
    ++heritageRouteRequest.current;
    heritageReturn.current = { control: document.activeElement instanceof HTMLElement ? document.activeElement : null, kind: 'map', controlKey: JSON.stringify(places.map(place => place.id)) };
    setHasHeritageReturn(true);
    setFocusRequest({ organization: places[0], relatedOrganizations: places.slice(1), token: ++focusSequence.current, temporary: true });
    setMode('map');
    requestAnimationFrame(() => mapPanelRef.current?.scrollIntoView?.({ block: 'start' }));
  }, []);
  const openHeritageRoute = useCallback(async (routeId: string) => {
    const request = ++heritageRouteRequest.current;
    const control = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setHeritageRouteError(false);
    try {
      const { getAvailableRoutes } = await import('./features/cultural-routes/routeLookup');
      if (request !== heritageRouteRequest.current) return;
      const route = getAvailableRoutes(organizations).find(item => item.route.id === routeId);
      if (!route) { setHeritageRouteError(true); return; }
      heritageReturn.current = { control, kind: 'route', controlKey: routeId, previousRoute: selectedRoute, previousStopId: selectedRouteStopId };
      setHasHeritageReturn(true);
      selectRoute(route);
      setVisited(current => ({ ...current, routes: true }));
      setMode('routes');
    } catch { if (request === heritageRouteRequest.current) setHeritageRouteError(true); }
  }, [organizations, selectedRoute, selectedRouteStopId, selectRoute]);
  const returnFocus = useRef<(() => void) | undefined>(undefined);
  const returnAction = useRef<'explore' | 'profile'>('explore');
  const openFaithSpace = useCallback((organization: ReligiousOrganization, restoreFocus?: () => void, panel: 'scene' | 'place' = 'scene') => {
    ++relatedSequence.current;
    ++heritageRouteRequest.current;
    const invokingControl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    returnFocus.current = restoreFocus ?? (() => invokingControl?.focus({ preventScroll: true }));
    returnAction.current = panel === 'place' ? 'profile' : 'explore';
    setFaithSpacePanel(panel);
    setSelectedOrganization(organization);
  }, []);
  const closeFaithSpace = useCallback(() => {
    ++relatedSequence.current;
    setSelectedOrganization(undefined);
    requestAnimationFrame(() => returnFocus.current?.());
  }, []);
  const returnToPlace = useCallback(() => {
    const origin = relatedOrigin.current;
    if (!origin) return;
    relatedOrigin.current = undefined; setHasRelatedReturn(false); setRelatedSelection(undefined);
    setMode(origin.mode); setSelectedRoute(origin.route); setSelectedRouteStopId(origin.stopId);
    heritageReturn.current = origin.heritage; setHasHeritageReturn(!!origin.heritage);
    setFocusRequest(origin.focus ? origin.focus.temporary ? { ...origin.focus, token: ++focusSequence.current } : { ...origin.focus, preserveViewport: true } : undefined);
    openFaithSpace(origin.organization, () => {
      origin.restoreFocus?.();
      if (!mainRef.current?.contains(document.activeElement) || (document.activeElement as Element | null)?.closest('[hidden]')) {
        const attribute = origin.invokerAction === 'profile' ? 'data-open-profile-organization' : 'data-explore-organization';
        const control = [...(mainRef.current?.querySelectorAll<HTMLElement>(`[${attribute}]`) ?? [])]
          .find(element => element.getAttribute(attribute) === origin.organization.id && !element.closest('[hidden]'));
        (control ?? mainRef.current)?.focus({ preventScroll: true });
      }
    }, 'place');
    returnAction.current = origin.invokerAction;
  }, [openFaithSpace]);
  const exitRoute = useCallback(() => {
    if (relatedOrigin.current) { returnToPlace(); return; }
    if (heritageReturn.current?.kind === 'route') { returnToHeritage(); return; }
    setSelectedRoute(undefined); setSelectedRouteStopId(undefined); setMode('map');
    requestAnimationFrame(() => {
      mapPanelRef.current?.scrollIntoView?.({ block: 'start' });
      mapPanelRef.current?.focus({ preventScroll: true });
    });
  }, [returnToHeritage, returnToPlace]);
  const openRelatedContent = useCallback(async (target: RelatedCulturalTarget) => {
    const organization = selectedOrganization;
    if (!organization || relatedOrigin.current) return;
    const sequence = ++relatedSequence.current;
    const { getRelatedCulturalItems } = await import('./utils/relatedContent');
    if (sequence !== relatedSequence.current) return;
    const valid = getRelatedCulturalItems(organization, organizations).some(item => item.target.kind === target.kind && item.target.id === target.id && item.target.organizationId === target.organizationId);
    if (!valid) throw new Error('Related content is unavailable');
    let route: ResolvedCulturalRoute | undefined;
    if (target.kind === 'route') {
      const { getAvailableRoutes } = await import('./features/cultural-routes/routeLookup');
      if (sequence !== relatedSequence.current) return;
      route = getAvailableRoutes(organizations).find(item => item.route.id === target.id);
      if (!route) throw new Error('Related route is unavailable');
    }
    relatedOrigin.current = { organization, mode, route: selectedRoute, stopId: selectedRouteStopId, focus: focusRequest, heritage: heritageReturn.current, restoreFocus: returnFocus.current, invokerAction: returnAction.current };
    setHasRelatedReturn(true); setRelatedSelection({ target, token: sequence }); setSelectedOrganization(undefined);
    heritageReturn.current = undefined; setHasHeritageReturn(false); setFocusRequest(undefined);
    const nextMode = target.kind === 'event' ? 'calendar' : target.kind === 'route' ? 'routes' : 'heritage';
    setVisited(current => ({ ...current, [nextMode]: true })); setMode(nextMode);
    if (route) {
      setSelectedRoute(route); setSelectedRouteStopId(target.organizationId);
      requestAnimationFrame(() => routeGuideRef.current?.querySelector<HTMLElement>('.route-title')?.focus());
    }
  }, [selectedOrganization, organizations, mode, selectedRoute, selectedRouteStopId, focusRequest]);

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
    <div className="app" inert={selectedOrganization || gardenOpen ? true : undefined}>
      <a className="skip-link" href="#main-content">{language === 'zh' ? '跳至主要內容' : 'Skip to main content'}</a>
      <header className="app-header">
        <div>
          <p className="eyebrow">Open Data Map</p>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
        <div className="header-optional-actions">
          {(flags.quietPresence || flags.quietCorner) && <button className="text-button" onClick={event => { event.currentTarget.focus(); gardenInvoker.current = event.currentTarget; setGardenOpen(true); }}>{language === 'zh' ? '靜心庭院' : 'Quiet Garden'}</button>}
          <LanguageToggle language={language} onChange={handleLanguageChange} />
        </div>
      </header>

      <nav className="discovery-navigation" aria-label={discovery.navigation}>
        {(['map', 'calendar', 'routes', 'heritage'] as const).map(item => <button key={item} type="button" aria-current={mode === item ? 'page' : undefined} onClick={() => navigate(item)}>{discovery[item]}</button>)}
      </nav>

      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {mode === 'map' && <section className="welcome-note" aria-label={language === 'zh' ? '從這裡開始' : 'Start here'}>
          <p>{language === 'zh' ? '走進台北的信仰文化，慢慢探索，也可以只是停留片刻。' : "Discover Taipei’s faith and culture, explore at your own pace, or simply stay for a moment."}</p>
          <div className="welcome-actions">
            <button className="primary-button" disabled={!filteredOrganizations.length} onClick={event => {
              const control = event.currentTarget;
              control.focus();
              if (filteredOrganizations[0]) openFaithSpace(filteredOrganizations[0], () => control.focus({ preventScroll: true }));
            }}>{language === 'zh' ? '探索一處信仰空間' : 'Explore a Faith Space'}</button>
            <a href="#faith-main-map" onClick={() => mapPanelRef.current?.focus()}>{language === 'zh' ? '自在瀏覽地圖' : 'Browse the map'}</a>
          </div>
        </section>}
        {dataLoadError ? <p className="status-text">{t.dataLoadError}</p> : null}
        {hasRelatedReturn && <div className="heritage-return-banner">
          <p>{relatedOrigin.current?.organization.name}</p>
          <button className="text-button" onClick={returnToPlace}>{language === 'zh' ? '返回場所介紹' : 'Return to place profile'}</button>
        </div>}
        {hasHeritageReturn && (mode === 'map' || mode === 'routes') && <div className="heritage-return-banner">
          <div>{focusRequest?.temporary && <p>{discovery.currentLocations}</p>}</div>
          <button className="text-button" onClick={returnToHeritage}>{discovery.returnHeritage}</button>
        </div>}
        {visited.heritage && <div hidden={mode !== 'heritage'} className="heritage-workspace" ref={heritageGuideRef}>
          {heritageRouteError && <p role="alert">{discovery.routeUnavailable}</p>}
          <ExplorationBoundary language={language} onReturnMap={() => navigate('map')}>
            <Suspense fallback={<p role="status">{discovery.loading}</p>}><HeritageExplorer organizations={organizations} language={language}
              onViewMap={viewHeritagePlaces} onExplore={openFaithSpace} onOpenProfile={organization => openFaithSpace(organization, undefined, 'place')}
              onOpenRoute={openHeritageRoute} relatedSelection={relatedSelection} onReturnRelated={returnToPlace} /></Suspense>
          </ExplorationBoundary>
        </div>}
        {visited.calendar && <div hidden={mode !== 'calendar'} className="calendar-workspace">
          <ExplorationBoundary language={language} onReturnMap={() => navigate('map')}>
            <Suspense fallback={<p role="status">{discovery.loading}</p>}><ReligiousCalendar organizations={organizations} language={language} onViewMap={viewOnMap} onExplore={openFaithSpace} relatedSelection={relatedSelection} /></Suspense>
          </ExplorationBoundary>
        </div>}
        <section className={`workspace${mode === 'routes' ? ' route-workspace' : ''}`} hidden={mode === 'calendar' || mode === 'heritage'} aria-label={t.appTitle} ref={workspaceRef}>
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
            {mode === 'map' && focusRequest && <div className="discovery-focused-place"><p>{focusRequest.temporary && focusRequest.historical !== false ? discovery.currentLocations : discovery.focused}<strong>{focusRequest.temporary && focusRequest.historical !== false ? ` · ${focusRequest.organization.name}` : focusRequest.organization.name}</strong></p>{!focusRequest.temporary && <button className="text-button" onClick={() => setFocusRequest(undefined)}>{discovery.clearFocus}</button>}</div>}
            <h2 className="visually-hidden">{mode === 'routes' ? discovery.routeMap : discovery.ordinaryMap}</h2>
            <ReligiousOrganizationMap
              items={filteredOrganizations}
              language={language}
              userLocation={userLocation}
              onExplore={openFaithSpace}
              visible={mode !== 'calendar' && mode !== 'heritage'}
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
    {gardenOpen && <QuietGardenBoundary language={language} onClose={closeGarden}><Suspense fallback={<QuietGardenStatus language={language} onClose={closeGarden} />}>
      <QuietGardenDialog language={language} onLanguageChange={handleLanguageChange} onClose={closeGarden} />
    </Suspense></QuietGardenBoundary>}
    {selectedOrganization && <FaithSpaceBoundary language={language} onClose={closeFaithSpace}><Suspense fallback={<FaithSpaceStatus language={language} onClose={closeFaithSpace} />}>
      <FaithSpaceModal organization={selectedOrganization} language={language} onLanguageChange={handleLanguageChange} onClose={closeFaithSpace} initialPanel={faithSpacePanel}
        organizations={organizations} onNavigateRelated={hasRelatedReturn ? undefined : openRelatedContent} />
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
