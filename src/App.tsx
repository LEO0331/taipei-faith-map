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
import { FaithSpaceBoundary, FaithSpaceStatus } from './features/faith-spaces/FaithSpaceLoader';
import { getPublicAssetPath } from './utils/assets';
import { calculateDistanceMeters } from './utils/geo';
import { buildSummary, filterOrganizations } from './utils/data';
import { getStoredLanguage, translations } from './utils/i18n';

const radiusOptions = [500, 1000, 2000, 5000];
const FaithSpaceModal = lazy(() => import('./features/faith-spaces/FaithSpaceModal'));

export function App() {
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage());
  const [organizations, setOrganizations] = useState<ReligiousOrganization[]>([]);
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(getStoredLanguage()));
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();
  const [nearbyError, setNearbyError] = useState<string>();
  const [dataLoadError, setDataLoadError] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<ReligiousOrganization>();
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

      <main>
        {dataLoadError ? <p className="status-text">{t.dataLoadError}</p> : null}
        <section className="workspace" aria-label={t.appTitle}>
          <FilterPanel
            districts={districts}
            filters={filters}
            language={language}
            resultCount={filteredOrganizations.length}
            setFilters={setFilters}
            villages={villages}
          />
          <div className="map-column">
            <ReligiousOrganizationMap
              items={filteredOrganizations}
              language={language}
              userLocation={userLocation}
              onExplore={openFaithSpace}
            />
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
        </section>

        <Dashboard language={language} summary={filteredSummary} />
        <ReligiousOrganizationList items={filteredOrganizations} language={language} onExplore={openFaithSpace} />
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
