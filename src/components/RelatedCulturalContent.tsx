import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Language, ReligiousOrganization } from '../types';
import { getRelatedCulturalItems } from '../utils/relatedContent';
import type { RelatedCulturalTarget } from './relatedContentTypes';

const labels = {
  zh: { title: '相關文化探索', milestone: '歷史里程碑', story: '文化故事', route: '文化散步路線', event: '有來源的活動公告', historical: '歷史連結對應目前登記場所，並非經查證的歷史座標。', opening: '正在開啟相關內容…', failed: '相關內容暫時無法開啟，請再試一次。' },
  en: { title: 'Related Cultural Content', milestone: 'Historical milestone', story: 'Heritage story', route: 'Cultural walking route', event: 'Sourced event notice', historical: 'Historical links refer to current registered places, not verified historical coordinates.', opening: 'Opening related content…', failed: 'Related content could not be opened. Please try again.' },
};

export function RelatedCulturalContent({ organization, organizations, language, onNavigate }: {
  organization: ReligiousOrganization;
  organizations: ReligiousOrganization[];
  language: Language;
  onNavigate: (target: RelatedCulturalTarget) => void | Promise<void>;
}) {
  const headingId = useId();
  const items = useMemo(() => getRelatedCulturalItems(organization, organizations), [organization, organizations]);
  const t = labels[language];
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  const invokingControl = useRef<HTMLButtonElement | null>(null);
  const previouslyPending = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (previouslyPending.current && !pending) invokingControl.current?.focus();
    previouslyPending.current = pending;
  }, [pending]);
  if (!items.length) return null;
  return <section className="related-cultural-content" aria-labelledby={headingId}>
    <h3 id={headingId}>{t.title}</h3>
    <ul>
      {items.map(item => <li key={`${item.target.kind}:${item.target.id}`}>
        <button type="button" className="text-button related-cultural-link" style={{ minHeight: 44 }} disabled={pending} onClick={async event => {
          event.currentTarget.focus();
          invokingControl.current = event.currentTarget;
          setFailed(false); setPending(true);
          try { await onNavigate(item.target); }
          catch { if (mounted.current) setFailed(true); }
          finally { if (mounted.current) setPending(false); }
        }}>
          <span className="related-cultural-kind">{t[item.target.kind]}</span>
          <strong>{item.title[language]}</strong>
          {item.detail && <small>{item.detail[language]}</small>}
        </button>
      </li>)}
    </ul>
    {pending && <p role="status">{t.opening}</p>}
    {failed && <p role="alert">{t.failed}</p>}
    {items.some(item => item.target.kind === 'milestone' || item.target.kind === 'story') && <p className="related-cultural-notice">{t.historical}</p>}
  </section>;
}
