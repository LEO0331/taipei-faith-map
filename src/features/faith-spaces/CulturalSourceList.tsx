import { useId } from 'react';
import type { Language } from '../../types';
import { getSafeSourceUrl } from './culturalSources';
import type { SourceReference } from './placeProfileTypes';

const labels = {
  zh: { sources: '資料來源', verified: '資料核對日期', newTab: '在新分頁開啟' },
  en: { sources: 'Sources', verified: 'Source checked', newTab: 'opens in a new tab' },
};

/** Evidence stays beside the claim it supports; invalid destinations are never rendered. */
export function CulturalSourceList({ sources, language, headingLevel = 4 }: { sources: SourceReference[]; language: Language; headingLevel?: 3 | 4 | 5 | 6 }) {
  const headingId = useId();
  const t = labels[language];
  const Heading = `h${headingLevel}` as 'h3' | 'h4' | 'h5' | 'h6';
  const links = sources.flatMap(source => {
    const href = getSafeSourceUrl(source.url);
    return href ? [{ source, href, host: new URL(href).hostname }] : [];
  });

  if (links.length === 0) return null;

  return (
    <div className="cultural-sources">
      <Heading className="cultural-source-heading" id={headingId}>{t.sources}</Heading>
      <ul aria-labelledby={headingId}>
        {links.map(({ source, href, host }) => (
          <li key={`${source.id}:${href}`}>
            <a href={href} target="_blank" rel="noopener noreferrer"
              aria-label={`${source.title[language]} — ${host} (${t.newTab})`}>
              {source.title[language]} <span aria-hidden="true">↗</span>
            </a>
            <p className="cultural-source-meta">{source.publisher} · {host}</p>
            <p className="cultural-source-meta">{t.verified}: <time dateTime={source.verifiedAt}>{source.verifiedAt}</time></p>
          </li>
        ))}
      </ul>
    </div>
  );
}
