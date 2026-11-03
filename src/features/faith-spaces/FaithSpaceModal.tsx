import { useEffect, useId, useRef, useState } from 'react';
import type { Language, ReligiousOrganization } from '../../types';
import { LanguageToggle } from '../../components/LanguageToggle';
import { religionLabels } from '../../utils/i18n';
import { getFaithSpaceConfig } from './faithSpaceConfig';
import { FaithSpaceIllustration } from './FaithSpaceIllustration';
import { ReflectionTimer } from './ReflectionTimer';
import './faith-spaces.css';

type Props = {
  organization: ReligiousOrganization;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onClose: () => void;
};

const labels = {
  zh: {
    exhibition: '信仰空間 · 文化探索', back: '返回地圖', close: '關閉信仰空間',
    disclaimer: '此為宗教文化示意場景，非該場所的實際建築或室內配置。',
    instructions: '選擇畫面上的編號，認識空間裡的文化細節。',
    general: '文化導覽 · 一般性介紹', etiquette: '參訪禮儀', facts: '公開資料 · 此場所',
    collapse: '收合說明', expand: '展開說明', count: '探索細節',
  },
  en: {
    exhibition: 'FAITH SPACES · CULTURAL EXPLORATION', back: 'Return to map', close: 'Close Faith Space',
    disclaimer: 'This is an illustrative cultural scene, not a reconstruction of this specific location.',
    instructions: 'Choose a numbered point to discover the cultural details of this space.',
    general: 'CULTURAL GUIDE · GENERAL INTRODUCTION', etiquette: 'Visitor etiquette', facts: 'OPEN DATA · THIS LOCATION',
    collapse: 'Collapse information', expand: 'Expand information', count: 'Details to explore',
  },
};

export default function FaithSpaceModal({ organization, language, onLanguageChange, onClose }: Props) {
  const config = getFaithSpaceConfig(organization.religion);
  const [selectedId, setSelectedId] = useState(config.hotspots[0].id);
  const [expanded, setExpanded] = useState(true);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const descriptionId = useId();
  const panelId = useId();
  const t = labels[language];
  const selected = config.hotspots.find(hotspot => hotspot.id === selectedId) ?? config.hotspots[0];

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
          const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button, summary, a[href], [tabindex="0"]') ?? [])].filter(control => !control.matches(':disabled') && !control.closest('[hidden]'));
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
        <div className="faith-exhibition">
          <section className="faith-art-panel" aria-label={config.title[language]}>
            <div className="faith-scene">
              <FaithSpaceIllustration scene={config.id} />
              {config.hotspots.map((hotspot, index) => (
                <button key={hotspot.id} className={`faith-hotspot${selected.id === hotspot.id ? ' is-selected' : ''}`}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  aria-label={hotspot.title[language]} aria-pressed={selected.id === hotspot.id} aria-controls={panelId}
                  onClick={() => { setSelectedId(hotspot.id); setExpanded(true); }}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
              <div className="faith-art-caption"><span>{config.title[language]}</span><span>01 — 03</span></div>
            </div>
            <div className="faith-scene-guide"><span className="faith-overline">{t.count}</span><p>{t.instructions}</p></div>
          </section>
          <aside className="faith-info">
            <p className="faith-overline">{t.general}</p>
            <p className="faith-introduction">{config.introduction[language]}</p>
            <div className="faith-detail" id={panelId}>
              <div className="faith-detail-heading">
                <h2>{selected.title[language]}</h2>
                <button className="faith-detail-toggle" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} aria-label={expanded ? t.collapse : t.expand}>
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
              </div>
              <div hidden={!expanded} aria-live="polite"><p>{selected.body[language]}</p></div>
            </div>
            <details className="faith-etiquette"><summary>{t.etiquette}</summary><p>{config.etiquette[language]}</p></details>
            <ReflectionTimer language={language} />
            <div className="faith-location"><p className="faith-overline">{t.facts}</p><p>{organization.district}{organization.village ? ` · ${organization.village}` : ''}</p><p>{organization.address}</p></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
