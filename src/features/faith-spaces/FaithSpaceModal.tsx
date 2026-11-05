import { useEffect, useId, useRef, useState } from 'react';
import type { Language, ReligiousOrganization } from '../../types';
import { LanguageToggle } from '../../components/LanguageToggle';
import { religionLabels } from '../../utils/i18n';
import { getFaithSpaceConfig } from './faithSpaceConfig';
import { FaithSpaceIllustration } from './FaithSpaceIllustration';
import { ReflectionTimer } from './ReflectionTimer';
import { GuidedTourControls, tourLabels } from './GuidedTourControls';
import { PlaceProfilePanel } from './PlaceProfilePanel';
import { TraditionIntroduction } from './TraditionIntroduction';
import './faith-spaces.css';
import type { RelatedCulturalTarget } from '../../components/relatedContentTypes';

type Props = {
  organization: ReligiousOrganization;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onClose: () => void;
  initialPanel?: 'scene' | 'place';
  organizations?: ReligiousOrganization[];
  onNavigateRelated?: (target: RelatedCulturalTarget) => void | Promise<void>;
};

/** Match the controls a browser can actually tab to, including disclosure state. */
function tabbableControls(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>('button, summary, a[href], input, select, textarea, [tabindex]')].filter(control => {
    if (control.tabIndex < 0 || control.matches(':disabled') || control.closest('[hidden], [inert]')) return false;
    for (let ancestor: HTMLElement | null = control; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
        const summary = [...ancestor.children].find(child => child.tagName === 'SUMMARY');
        if (!summary?.contains(control)) return false;
      }
      if (ancestor === root) break;
    }
    return true;
  });
}

const labels = {
  zh: {
    exhibition: '信仰空間 · 文化探索', back: '返回地圖', close: '關閉信仰空間',
    disclaimer: '此為宗教文化示意場景，非該場所的實際建築或室內配置。',
    instructions: '選擇畫面上的編號，認識空間裡的文化細節。',
    general: '文化導覽 · 一般性介紹', etiquette: '參訪禮儀', facts: '公開資料 · 此場所',
    collapse: '收合說明', expand: '展開說明', count: '探索細節',
    scene: '文化示意', place: '認識這個場所', navigation: '探索內容',
    tourInstructions: '依序探索文化細節。點選任一熱點，或退出導覽，即可回到自由探索。',
  },
  en: {
    exhibition: 'FAITH SPACES · CULTURAL EXPLORATION', back: 'Return to map', close: 'Close Faith Space',
    disclaimer: 'This is an illustrative cultural scene, not a reconstruction of this specific location.',
    instructions: 'Choose a numbered point to discover the cultural details of this space.',
    general: 'CULTURAL GUIDE · GENERAL INTRODUCTION', etiquette: 'Visitor etiquette', facts: 'OPEN DATA · THIS LOCATION',
    collapse: 'Collapse information', expand: 'Expand information', count: 'Details to explore',
    scene: 'Cultural Scene', place: 'About This Place', navigation: 'Explore content',
    tourInstructions: 'Explore details in order. Select any hotspot or exit the tour to return to Free Exploration.',
  },
};

export default function FaithSpaceModal({ organization, language, onLanguageChange, onClose, initialPanel = 'scene', organizations, onNavigateRelated }: Props) {
  const config = getFaithSpaceConfig(organization.religion);
  const [selectedId, setSelectedId] = useState(config.hotspots[0].id);
  const [expanded, setExpanded] = useState(true);
  const [panel, setPanel] = useState<'scene' | 'place'>(initialPanel);
  const [guided, setGuided] = useState(false);
  const [completed, setCompleted] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const freeModeButton = useRef<HTMLButtonElement>(null);
  const tourNextButton = useRef<HTMLButtonElement>(null);
  const previouslyGuided = useRef(false);
  const headingId = useId();
  const descriptionId = useId();
  const panelId = useId();
  const topicId = useId();
  const topicBodyId = useId();
  const contentPanelId = useId();
  const t = labels[language];
  const selected = config.hotspots.find(hotspot => hotspot.id === selectedId) ?? config.hotspots[0];
  const selectedIndex = config.hotspots.indexOf(selected);
  const tour = tourLabels[language];
  const startTour = () => {
    setSelectedId(config.hotspots[0].id);
    setExpanded(true);
    setCompleted(false);
    setGuided(true);
    setPanel('scene');
  };
  const goTo = (index: number) => {
    setSelectedId(config.hotspots[Math.max(0, Math.min(config.hotspots.length - 1, index))].id);
    setExpanded(true);
    setCompleted(false);
  };

  useEffect(() => {
    if (guided) tourNextButton.current?.focus();
    else if (previouslyGuided.current && document.activeElement === document.body) freeModeButton.current?.focus();
    previouslyGuided.current = guided;
  }, [guided]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.current?.contains(event.target)) closeButton.current?.focus();
    };
    document.addEventListener('focusin', containFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('focusin', containFocus);
    };
  }, []);

  return (
    <div className={`faith-overlay faith-theme-${config.id}`}>
      <div className="faith-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId} aria-describedby={descriptionId} ref={dialog}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
          if (event.key !== 'Tab') return;
          const controls = dialog.current ? tabbableControls(dialog.current) : [];
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
        <header className="faith-header">
          <button ref={closeButton} className="faith-button faith-back" onClick={onClose} aria-label={t.close}><span aria-hidden="true">←</span> {t.back}</button>
          <p className="faith-overline">{t.exhibition}</p>
          <LanguageToggle language={language} onChange={onLanguageChange} />
        </header>
        <div className="faith-title-row">
          <div><p className="faith-overline">{religionLabels[language][organization.religion]}</p><h1 id={headingId}>{organization.name}</h1></div>
          <p className="faith-scene-title">{config.title[language]}</p>
        </div>
        <p className="faith-disclaimer" id={descriptionId}>{t.disclaimer}</p>
        <nav className="faith-content-navigation" aria-label={t.navigation}>
          <button className="faith-button" aria-pressed={panel === 'scene'} aria-controls={contentPanelId} onClick={() => setPanel('scene')}>{t.scene}</button>
          <button className="faith-button" aria-pressed={panel === 'place'} aria-controls={contentPanelId} onClick={() => setPanel('place')}>{t.place}</button>
        </nav>
        <div className={`faith-exhibition${guided && panel === 'scene' ? ' is-guided' : ''}`}>
          <section className="faith-art-panel" aria-label={config.title[language]}>
            <p className="faith-overline faith-art-label">{t.scene}</p>
            <div className="faith-exploration-modes" role="group" aria-label={tour.title} hidden={panel !== 'scene'}>
              <button ref={freeModeButton} className="faith-button" aria-pressed={!guided} onClick={() => { setGuided(false); setCompleted(false); }}>{tour.free}</button>
              <button className="faith-button" aria-pressed={guided} onClick={startTour}>{tour.title}</button>
            </div>
            <div className="faith-scene">
              <FaithSpaceIllustration scene={config.id} />
              {config.hotspots.map((hotspot, index) => (
                <button key={hotspot.id} className={`faith-hotspot${selected.id === hotspot.id ? ' is-selected' : ''}`}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  aria-label={hotspot.title[language]} aria-pressed={selected.id === hotspot.id} aria-controls={panelId}
                  aria-describedby={selected.id === hotspot.id && panel === 'scene' ? topicBodyId : undefined}
                  title={hotspot.title[language]}
                  onClick={() => { setGuided(false); setCompleted(false); setPanel('scene'); setSelectedId(hotspot.id); setExpanded(true); }}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
              <div className="faith-art-caption"><span>{config.title[language]}</span><span>{String(selectedIndex + 1).padStart(2, '0')} / {String(config.hotspots.length).padStart(2, '0')}</span></div>
            </div>
            {guided && panel === 'scene' && <GuidedTourControls language={language} index={selectedIndex} total={config.hotspots.length} completed={completed}
              nextButtonRef={tourNextButton}
              onPrevious={() => goTo(completed ? selectedIndex : selectedIndex - 1)}
              onNext={() => selectedIndex === config.hotspots.length - 1 ? setCompleted(true) : goTo(selectedIndex + 1)}
              onExit={() => { setGuided(false); setCompleted(false); }} onRestart={startTour} />}
            <div className="faith-scene-guide"><span className="faith-overline">{t.count}</span><p>{guided ? t.tourInstructions : t.instructions}</p></div>
          </section>
          <aside className="faith-info" id={contentPanelId} aria-label={panel === 'scene' ? t.scene : t.place}>
            <section hidden={panel !== 'scene'} aria-label={t.scene}>
            <p className="faith-overline">{t.general}</p>
            <p className="faith-introduction">{config.introduction[language]}</p>
            <div className="faith-detail" id={panelId} role="region" aria-labelledby={topicId} aria-live="polite" aria-atomic="true">
              {guided && <p className="faith-step-label">{completed ? tour.complete : tour.progress(selectedIndex + 1, config.hotspots.length)}</p>}
              <div className="faith-detail-heading">
                <h2 id={topicId}>{selected.title[language]}</h2>
                <button className="faith-detail-toggle" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} aria-label={expanded ? t.collapse : t.expand}>
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
              </div>
              <div hidden={!expanded}><p id={topicBodyId}>{selected.body[language]}</p></div>
            </div>
            <TraditionIntroduction religion={organization.religion} language={language} />
            <details className="faith-etiquette"><summary>{t.etiquette}</summary><p>{config.etiquette[language]}</p></details>
            <ReflectionTimer language={language} />
            <div className="faith-location"><p className="faith-overline">{t.facts}</p><p>{organization.district}{organization.village ? ` · ${organization.village}` : ''}</p><p>{organization.address}</p></div>
            </section>
            {panel === 'place' && <PlaceProfilePanel organization={organization} language={language} organizations={organizations} onNavigateRelated={onNavigateRelated} />}
          </aside>
        </div>
      </div>
    </div>
  );
}
