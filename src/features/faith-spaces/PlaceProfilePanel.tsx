import { Component, lazy, Suspense, useId } from 'react';
import type { ReactNode } from 'react';
import type { Language, ReligiousOrganization } from '../../types';
import { religionLabels, translations } from '../../utils/i18n';
import { CulturalSourceList } from './CulturalSourceList';
import { getPlaceProfile } from './placeProfileLookup';
import type { RelatedCulturalTarget } from '../../components/relatedContentTypes';
const RelatedCulturalContent = lazy(() => import('../../components/RelatedCulturalContent').then(module => ({ default: module.RelatedCulturalContent })));

/** The optional discovery chunk must not replace an already available profile. */
class RelatedContentBoundary extends Component<{ language: Language; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p className="faith-review-note" role="status">{this.props.language === 'zh'
      ? '相關文化內容暫時無法載入，場所介紹與資料來源仍可閱讀。'
      : 'Related cultural content is unavailable. The place profile and sources remain available.'}</p> : this.props.children;
  }
}

const labels = {
  zh: {
    about: '認識這個場所', verified: '有來源支持的場所介紹',
    unavailable: '此場所目前尚無經查證的文化介紹，仍可探索一般宗教文化示意場景。',
    openData: '公開資料 · 登記資訊', source: '資料來源', reviewed: '最後核對',
    internal: '內部資料核對', community: '已記錄社群審閱', pending: '待核對',
    noEndorsement: '審閱狀態描述本專案的資料核對流程，不代表該場所的認可或背書。',
  },
  en: {
    about: 'About This Place', verified: 'Source-backed place information',
    unavailable: 'No verified cultural profile is currently available for this location. You can still explore the general cultural scene.',
    openData: 'Public Open Data · Registration', source: 'Data source', reviewed: 'Last reviewed',
    internal: 'Internal fact-check', community: 'Community review recorded', pending: 'Pending review',
    noEndorsement: 'Review status describes this project’s fact-checking process and does not imply approval or endorsement by this location.',
  },
};

export function PlaceProfilePanel({ organization, language, organizations, onNavigateRelated }: { organization: ReligiousOrganization; language: Language; organizations?: ReligiousOrganization[]; onNavigateRelated?: (target: RelatedCulturalTarget) => void | Promise<void> }) {
  const profile = getPlaceProfile(organization);
  const headingId = useId();
  const dataHeadingId = useId();
  const t = labels[language];
  const fields = translations[language];
  const reviewLabel = profile?.editorialReviewStatus === 'community-reviewed' ? t.community
    : profile?.editorialReviewStatus === 'internal-reviewed' ? t.internal : t.pending;

  return (
    <div className="place-profile">
      <section aria-labelledby={headingId}>
        {profile ? <p className="faith-overline">{t.verified}</p> : null}
        <h2 id={headingId}>{t.about}</h2>
        {profile ? (
          <>
            <p className="place-introduction">{profile.introduction[language]}</p>
            <CulturalSourceList sources={profile.sources} language={language} headingLevel={3} />
            {profile.facts.map(fact => (
              <article className="place-fact" key={fact.id}>
                <h3>{fact.title[language]}</h3>
                <p>{fact.description[language]}</p>
                <CulturalSourceList sources={fact.sources} language={language} />
              </article>
            ))}
            <div className="faith-review-note">
              <p>{reviewLabel} · {t.reviewed}: <time dateTime={profile.lastReviewed}>{profile.lastReviewed}</time></p>
              <p>{t.noEndorsement}</p>
            </div>
          </>
        ) : <p className="place-profile-unavailable">{t.unavailable}</p>}
      </section>
      {organizations && onNavigateRelated && <RelatedContentBoundary language={language}><Suspense fallback={<p role="status">{language === 'zh' ? '載入相關文化探索…' : 'Loading related cultural content…'}</p>}>
        <RelatedCulturalContent organization={organization} organizations={organizations} language={language} onNavigate={onNavigateRelated} />
      </Suspense></RelatedContentBoundary>}
      <section className="faith-open-data" aria-labelledby={dataHeadingId}>
        <h3 id={dataHeadingId}>{t.openData}</h3>
        <dl>
          <div><dt>{fields.name}</dt><dd>{organization.name}</dd></div>
          <div><dt>{fields.religion}</dt><dd>{religionLabels[language][organization.religion]}</dd></div>
          <div><dt>{fields.district}</dt><dd>{organization.district}</dd></div>
          <div><dt>{fields.address}</dt><dd>{organization.address}</dd></div>
          <div><dt>{t.source}</dt><dd>{organization.source}</dd></div>
        </dl>
      </section>
    </div>
  );
}
