import type { Language, ReligionType } from '../../types';
import { getTraditionContent } from './traditionContent';
import { CulturalSourceList } from './CulturalSourceList';

export function TraditionIntroduction({ religion, language }: { religion: ReligionType; language: Language }) {
  const content = getTraditionContent(religion);
  if (!content) return null;
  return <section className="faith-tradition" aria-label={content.title[language]}>
    <h2>{content.title[language]}</h2>
    <p>{content.introduction[language]}</p>
    <CulturalSourceList sources={content.sources} language={language} headingLevel={3} />
    {content.concepts.map(concept => <div key={concept.id}>
      <h3>{concept.title[language]}</h3><p>{concept.description[language]}</p>
      <CulturalSourceList sources={concept.sources} language={language} />
    </div>)}
    <p className="faith-review-note">{language === 'zh' ? '內部資料核對，尚未經宗教代表審閱。核對日期：' : 'Internally fact-checked; not reviewed by a religious representative. Reviewed: '}{content.lastReviewed}</p>
  </section>;
}
