import { useEffect, useId, useMemo, useRef } from 'react';
import type { Language, ReligiousOrganization } from '../../types';
import { religionLabels, translations } from '../../utils/i18n';
import { CulturalSourceList } from '../faith-spaces/CulturalSourceList';
import { getAvailableRoutes } from './routeLookup';
import { getWalkingDirections } from './walkingDirections';
import type { ResolvedCulturalRoute } from './routeTypes';
import './routes.css';

type Props = {
  organizations: ReligiousOrganization[];
  language: Language;
  selectedRoute?: ResolvedCulturalRoute;
  selectedStopId?: string;
  onSelectRoute: (route: ResolvedCulturalRoute | undefined) => void;
  onSelectStop: (organizationId: string) => void;
  onExplore: (organization: ReligiousOrganization) => void;
  onExit: () => void;
};

const labels = {
  zh: {
    title: '宗教文化散步路線', introduction: '沿著有來源支持的文化線索，認識真實的臺北場所。',
    eyebrow: '臺北 · 文化連結', newTab: '在新分頁開啟',
    available: '條可探索路線', stops: '個停留點', traditions: '種教別', choose: '選擇路線',
    overview: '返回路線總覽', exit: '退出路線', previous: '上一站', next: '下一站',
    walking: '開啟步行導航', legs: '分段步行導航', leg: (from: number, to: number) => `第 ${from} 站至第 ${to} 站`,
    empty: '目前尚無可用且已核對的文化路線。', reviewed: '資料核對日期',
    internal: '內部資料核對', community: '已記錄社群審閱',
    directionsNote: '地圖僅標示依序停留的場所；實際步行路徑由 Google 地圖提供。',
    visitNote: '出發前請向場所確認開放及參訪規範。此導覽未查證步行安全、無障礙通行或人行道連續性。',
    sourcesNote: '文化敘述附有公開來源，不代表場所認可或背書。',
    selected: '目前停留點', progress: (step: number, total: number) => `第 ${step}／${total} 站`,
  },
  en: {
    title: 'Cultural Walking Routes', introduction: 'Follow source-backed cultural connections between real places in Taipei.',
    eyebrow: 'TAIPEI · CULTURAL CONNECTIONS', newTab: 'opens in a new tab',
    available: 'routes to explore', stops: 'stops', traditions: 'traditions', choose: 'Choose route',
    overview: 'Return to route overview', exit: 'Exit route', previous: 'Previous stop', next: 'Next stop',
    walking: 'Open Walking Directions', legs: 'Walking directions by leg', leg: (from: number, to: number) => `Stop ${from} to stop ${to}`,
    empty: 'No available, reviewed cultural routes are currently listed.', reviewed: 'Source checked',
    internal: 'Internal fact-check', community: 'Community review recorded',
    directionsNote: 'The map marks ordered stops only. Google Maps provides the actual walking directions.',
    visitNote: 'Check opening and visitor arrangements with each location before setting out. Walking safety, step-free access and continuous sidewalks have not been verified by this guide.',
    sourcesNote: 'Cultural descriptions cite published sources and do not imply approval or endorsement by the locations.',
    selected: 'Selected stop', progress: (step: number, total: number) => `${step} of ${total} stops`,
  },
};

export default function CulturalRoutes({ organizations, language, selectedRoute, selectedStopId, onSelectRoute, onSelectStop, onExplore, onExit }: Props) {
  const t = labels[language];
  const available = useMemo(() => getAvailableRoutes(organizations), [organizations]);
  const selected = available.find(item => item.route.id === selectedRoute?.route.id);
  const headingId = useId();
  const stopHeadingId = useId();
  const stopPanelId = useId();
  const overviewHeading = useRef<HTMLHeadingElement>(null);
  const routeHeading = useRef<HTMLHeadingElement>(null);
  const previousRouteId = useRef<string | undefined>(undefined);
  const currentIndex = selected ? Math.max(0, selected.organizations.findIndex(organization => organization.id === selectedStopId)) : 0;
  const activeOrganization = selected?.organizations[currentIndex];
  const activeStop = selected?.route.stops[currentIndex];
  const directions = useMemo(() => selected ? getWalkingDirections(selected.organizations) : undefined, [selected]);
  const stopButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const recoverControlFocus = useRef(false);

  useEffect(() => {
    if (selectedRoute && !selected) onSelectRoute(undefined);
    else if (selected && !selected.organizations.some(organization => organization.id === selectedStopId)) onSelectStop(selected.organizations[0].id);
  }, [selected, selectedRoute, selectedStopId, onSelectRoute, onSelectStop]);

  useEffect(() => {
    if (recoverControlFocus.current) {
      stopButtons.current[currentIndex]?.focus();
      recoverControlFocus.current = false;
    }
  }, [currentIndex]);

  useEffect(() => {
    if (selected?.route.id && previousRouteId.current !== selected.route.id) routeHeading.current?.focus();
    else if (!selected && previousRouteId.current) overviewHeading.current?.focus();
    previousRouteId.current = selected?.route.id;
  }, [selected]);

  const moveStop = (index: number) => {
    if (!selected) return;
    recoverControlFocus.current = true;
    onSelectStop(selected.organizations[index].id);
  };

  return <section className="cultural-routes" aria-labelledby={headingId}>
    <header className="route-section-heading">
      <div><p className="eyebrow">{t.eyebrow}</p><h2 id={headingId} ref={overviewHeading} tabIndex={-1}>{t.title}</h2><p>{t.introduction}</p></div>
      {selected && <button className="text-button" onClick={onExit}>{t.exit}</button>}
    </header>
    {!selected ? <>
      <p className="route-availability">{available.length} {t.available}</p>
      {available.length === 0 && <p className="status-text">{t.empty}</p>}
      <div className="cultural-route-list">
        {available.map(item => <article className="cultural-route-card" key={item.route.id}>
          <p className="route-districts">{item.route.districtLabels.join(' · ')}</p>
          <h3>{item.route.title[language]}</h3><p>{item.route.description[language]}</p>
          <p className="route-card-meta">{item.organizations.length} {t.stops} · {new Set(item.organizations.map(organization => organization.religion)).size} {t.traditions}</p>
          <button className="primary-button" onClick={() => onSelectRoute(item)}>{t.choose}<span className="route-sr-only">: {item.route.title[language]}</span></button>
        </article>)}
      </div>
    </> : <div className="selected-cultural-route">
      <button className="text-button" onClick={() => onSelectRoute(undefined)}>← {t.overview}</button>
      <h3 className="route-title" ref={routeHeading} tabIndex={-1}>{selected.route.title[language]}</h3><p>{selected.route.description[language]}</p>
      <p className="route-review">{selected.route.editorialReviewStatus === 'community-reviewed' ? t.community : t.internal} · {t.reviewed}: <time dateTime={selected.route.lastReviewed}>{selected.route.lastReviewed}</time></p>
      <p className="route-notice">{t.directionsNote}</p>
      <ol className="route-stop-list">
        {selected.route.stops.map((stop, index) => {
          const organization = selected.organizations[index];
          return <li key={stop.organizationId}>
            <button ref={element => { stopButtons.current[index] = element; }} aria-pressed={organization.id === selectedStopId} aria-controls={stopPanelId}
              onClick={() => onSelectStop(organization.id)}>
              <span className="route-stop-number" aria-hidden="true">{index + 1}</span>
              <span><strong>{stop.title[language]}</strong><small>{religionLabels[language][organization.religion]} · {organization.district}</small></span>
              <span className="route-sr-only">{t.progress(index + 1, selected.organizations.length)}</span>
            </button>
          </li>;
        })}
      </ol>
      {activeStop && activeOrganization && <article className="route-stop-detail" id={stopPanelId} role="region" tabIndex={-1} aria-labelledby={stopHeadingId}>
        <p className="route-step-label">{t.selected} · {t.progress(currentIndex + 1, selected.organizations.length)}</p>
        <h3 id={stopHeadingId}>{activeStop.title[language]}</h3>
        <p>{activeStop.description[language]}</p>
        <p className="route-address">{activeOrganization.name}<br />{activeOrganization.address}</p>
        <div className="route-stop-actions">
          <button className="text-button" disabled={currentIndex === 0} onClick={() => moveStop(currentIndex - 1)}>{t.previous}</button>
          <button className="text-button" disabled={currentIndex === selected.organizations.length - 1} onClick={() => moveStop(currentIndex + 1)}>{t.next}</button>
          <button className="primary-button" data-explore-organization={activeOrganization.id} onClick={event => { event.currentTarget.focus(); onExplore(activeOrganization); }}>{translations[language].exploreFaithSpace}</button>
        </div>
        <CulturalSourceList sources={activeStop.sourceReferences} language={language} />
      </article>}
      {directions && <div className="route-directions">
        {directions.url ? <a className="route-directions-link" href={directions.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.walking} · Google Maps (${t.newTab})`}>{t.walking} · Google Maps ↗</a>
          : <><h4>{t.legs}</h4><ul>{directions.legs.map(leg => <li key={leg.fromIndex}><a href={leg.url} target="_blank" rel="noopener noreferrer" aria-label={`${t.leg(leg.fromIndex + 1, leg.toIndex + 1)} · Google Maps (${t.newTab})`}>{t.leg(leg.fromIndex + 1, leg.toIndex + 1)} · Google Maps ↗</a></li>)}</ul></>}
      </div>}
      <p className="route-notice">{t.visitNote}</p><p className="route-review">{t.sourcesNote}</p>
    </div>}
  </section>;
}
