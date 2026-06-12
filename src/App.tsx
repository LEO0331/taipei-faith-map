import { useEffect, useMemo, useState } from 'react';
import type {
  Filters,
  Language,
  NearbyResult,
  ReligiousOrganization,
  ReligiousSummary,
} from './types';
import { Dashboard } from './components/Dashboard';
import { DisclaimerNotice } from './components/DisclaimerNotice';
import { FilterPanel } from './components/FilterPanel';
import { Footer } from './components/Footer';
import { LanguageToggle } from './components/LanguageToggle';
import { NearbyPanel } from './components/NearbyPanel';
import { ReligiousOrganizationList } from './components/ReligiousOrganizationList';
import { ReligiousOrganizationMap } from './components/ReligiousOrganizationMap';
import { calculateDistanceMeters } from './utils/geo';
import { buildSummary, filterOrganizations } from './utils/data';
import { getStoredLanguage, translations } from './utils/i18n';

const initialFilters: Filters = {
  religion: '全部',
  district: '',
  village: '',
  hasFestivalDate: false,
  search: '',
};

const radiusOptions = [500, 1000, 2000, 5000];

export function App() {
  const [language, setLanguage] = useState<Language>(() => getStoredLanguage());
  const [organizations, setOrganizations] = useState<ReligiousOrganization[]>([]);
  const [summary, setSummary] = useState<ReligiousSummary | undefined>();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>();
  const [nearbyError, setNearbyError] = useState<string>();

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('taipei-faith-map-language', language);
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  }, [language]);

  useEffect(() => {
    Promise.all([
      fetch('/data/religious-organizations.json').then((response) => response.json()),
      fetch('/data/religious-summary.json').then((response) => response.json()),
    ])
      .then(([items, summaryData]) => {
        setOrganizations(items);
        setSummary(summaryData);
      })
      .catch(() => {
        setOrganizations([]);
      });
  }, []);

  const filteredOrganizations = useMemo(
    () => filterOrganizations(organizations, filters),
    [organizations, filters],
  );

  const fallbackSummary = useMemo(() => buildSummary(organizations), [organizations]);
  const activeSummary = summary ?? fallbackSummary;

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
    return organizations
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
  }, [organizations, radiusMeters, userLocation]);

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setFilters((current) => ({
      ...current,
      religion:
        current.religion === '全部' || current.religion === 'All'
          ? nextLanguage === 'zh'
            ? '全部'
            : 'All'
          : current.religion,
    }));
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
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Open Data Map</p>
          <h1>{t.appTitle}</h1>
          <p>{t.appSubtitle}</p>
        </div>
        <LanguageToggle language={language} onChange={handleLanguageChange} />
      </header>

      <main>
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

        <Dashboard language={language} summary={activeSummary} />
        <ReligiousOrganizationList items={filteredOrganizations.slice(0, 60)} language={language} />
        <DisclaimerNotice language={language} />
      </main>

      <Footer language={language} />
    </div>
  );
}
