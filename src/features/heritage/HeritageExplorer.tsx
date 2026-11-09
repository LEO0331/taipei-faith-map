import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Language, ReligiousOrganization } from '../../types';
import { religionLabels, translations } from '../../utils/i18n';
import { CulturalSourceList } from '../faith-spaces/CulturalSourceList';
import { getPlaceProfile } from '../faith-spaces/placeProfileLookup';
import { getAvailableRoutes } from '../cultural-routes/routeLookup';
import { formatHistoricalDate, getAvailableHeritage, resolveHeritagePlaces, sortHistoricalMilestones } from './heritageLookup';
import type { HeritageContent as HeritageData, HeritageStory, HistoricalMilestone } from './heritageTypes';
import type { RelatedSelectionRequest } from '../../components/relatedContentTypes';
import './heritage.css';

type Filters = { religion: string; district: string; theme: string };
type Props = {
  organizations: ReligiousOrganization[];
  language: Language;
  onViewMap: (organizations: ReligiousOrganization[]) => void;
  onExplore: (organization: ReligiousOrganization) => void;
  onOpenProfile: (organization: ReligiousOrganization) => void;
  onOpenRoute: (routeId: string) => void;
  data?: HeritageData;
  relatedSelection?: RelatedSelectionRequest;
  onReturnRelated?: () => void;
};
const emptyFilters = (): Filters => ({ religion: '', district: '', theme: '' });
const labels = {
  zh: {
    timeline: '宗教歷史時間軸', stories: '臺北信仰文化故事', eyebrow: '臺北 · 有來源的歷史閱讀', views: '歷史探索內容',
    introduction: '從公開史料認識場所、建築與社群的不同歷史。',
    distinction: '現代登記資料不代表歷史分布或法人沿革。以下地圖連結標示目前登記位置，不是已查證的歷史座標。',
    religion: '教別', district: '行政區', theme: '歷史主題', all: '全部', clear: '清除時間軸篩選',
    foundation: '創建', architecture: '建築', community: '社群', heritage: '文化資產', transformation: '變遷',
    exact: '確切日期', year: '僅知年份', approximate: '概略日期', range: '年份區間', unknown: '日期未確定',
    previous: '上一則史事', next: '下一則史事', selected: '所選歷史里程碑', empty: '目前沒有符合條件且已核對的歷史內容。',
    evidence: '史料與查核', reviewed: '內部資料核對', reviewedDate: '核對日期', noEndorsement: '來源核對不代表宗教社群審閱或場所背書。',
    places: '相關場所 · 目前登記位置', currentMap: '查看目前登記位置', allPlaces: '查看全部相關現址', profile: '開啟經查證場所介紹',
    noPlace: '這段內容未連結可安全核對的現代登記場所，仍可閱讀史料與來源。',
    relatedStories: '延伸閱讀故事', readStory: '閱讀故事', relatedMilestones: '相關歷史里程碑', onTimeline: '在時間軸閱讀',
    introductionStage: '故事導讀', conclusion: '故事結語', start: '開始閱讀章節', previousChapter: '上一章', nextChapter: '下一章', finish: '閱讀結語',
    exit: '退出故事', restart: '重新閱讀', complete: '可以在這裡停一會兒。想再看看時，史料和相關場所都在下方。',
    chapter: (index: number, total: number) => `第 ${index}／${total} 章`, chapters: (total: number) => `共 ${total} 章`, route: '探索相關文化散步路線',
    returnChapter: '返回閱讀章節',
    storyEmpty: '目前沒有可供閱讀且已核對的文化故事。', sourceBased: '從史料到場所', chapterSources: '本章史料',
  },
  en: {
    timeline: 'Historical Timeline', stories: 'Heritage Stories', eyebrow: 'TAIPEI · DOCUMENTED HISTORIES', views: 'Historical discovery views',
    introduction: 'Read published histories of places, buildings and communities as distinct accounts.',
    distinction: 'Current registrations do not establish historical geography or legal continuity. Map links show current registered locations, not verified historical coordinates.',
    religion: 'Religion', district: 'District', theme: 'Historical theme', all: 'All', clear: 'Clear timeline filters',
    foundation: 'Foundation', architecture: 'Architecture', community: 'Community', heritage: 'Heritage', transformation: 'Transformation',
    exact: 'Exact date', year: 'Year only', approximate: 'Approximate date', range: 'Year range', unknown: 'Date uncertain',
    previous: 'Previous milestone', next: 'Next milestone', selected: 'Selected historical milestone', empty: 'No reviewed historical content matches these filters.',
    evidence: 'Sources and review', reviewed: 'Internal fact-check', reviewedDate: 'Reviewed', noEndorsement: 'Source checking does not imply religious-community review or endorsement by a location.',
    places: 'Related places · Current registered locations', currentMap: 'View current registered location', allPlaces: 'View all related current locations', profile: 'Open verified place profile',
    noPlace: 'No safely matched current registered place is linked here. You can still read the history and its sources.',
    relatedStories: 'Related stories', readStory: 'Read story', relatedMilestones: 'Related historical milestones', onTimeline: 'Read on the timeline',
    introductionStage: 'Story introduction', conclusion: 'Story conclusion', start: 'Start chapters', previousChapter: 'Previous chapter', nextChapter: 'Next chapter', finish: 'Read conclusion',
    exit: 'Exit story', restart: 'Read again', complete: 'Feel free to pause here. The sources and related places are below whenever you want them.',
    chapter: (index: number, total: number) => `Chapter ${index} of ${total}`, chapters: (total: number) => `${total} chapters`, route: 'Explore related cultural walking route',
    returnChapter: 'Return to reading chapter',
    storyEmpty: 'No reviewed heritage stories are currently available.', sourceBased: 'FROM SOURCES TO PLACES', chapterSources: 'Chapter sources',
  },
};

export default function HeritageExplorer({ organizations, language, onViewMap, onExplore, onOpenProfile, onOpenRoute, data, relatedSelection, onReturnRelated }: Props) {
  const available = useMemo(() => getAvailableHeritage(organizations, data), [organizations, data]);
  const availableRoutes = useMemo(() => getAvailableRoutes(organizations), [organizations]);
  const ordered = useMemo(() => sortHistoricalMilestones(available.milestones), [available.milestones]);
  const [view, setView] = useState<'timeline' | 'stories'>('timeline');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<string>();
  const [storyId, setStoryId] = useState<string>();
  const [stage, setStage] = useState(-1);
  const [chapterMilestone, setChapterMilestone] = useState<{ id: string; filters: Filters; selectedId?: string }>();
  const origin = useRef<{ view: 'timeline' | 'stories'; selectedId?: string; filters: Filters; storyId: string; control: HTMLElement | null } | undefined>(undefined);
  const explorer = useRef<HTMLElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const storyHeading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef(false);
  const relatedSnapshot = useRef<{ view: 'timeline' | 'stories'; filters: Filters; selectedId?: string; storyId?: string; stage: number; origin: typeof origin.current; chapterMilestone: typeof chapterMilestone } | undefined>(undefined);
  const headingId = useId();
  const detailId = useId();
  const activeHeadingId = useId();
  const datePrefix = useId();
  const t = labels[language];
  const placeOrganizations = useMemo(() => resolveHeritagePlaces(available.places.map(place => place.organizationId), available.places, organizations), [available.places, organizations]);
  const religions = [...new Set([...placeOrganizations.map(organization => organization.religion), ...available.milestones.flatMap(milestone => milestone.religions ?? [])])];
  const districts = [...new Set([...placeOrganizations.map(organization => organization.district), ...available.milestones.flatMap(milestone => milestone.districts ?? [])])].sort();
  const visible = ordered.filter(milestone => {
    const places = resolveHeritagePlaces(milestone.organizationIds, available.places, organizations);
    return (!filters.theme || milestone.theme === filters.theme)
      && (!filters.religion || (milestone.religions ?? places.map(place => place.religion)).includes(filters.religion as ReligiousOrganization['religion']))
      && (!filters.district || (milestone.districts ?? places.map(place => place.district)).includes(filters.district));
  });
  const selected = visible.find(milestone => milestone.id === selectedId) ?? visible[0];
  const selectedIndex = selected ? visible.indexOf(selected) : -1;
  const story = available.stories.find(item => item.id === storyId);
  const chapter = story && stage >= 0 && stage < story.chapters.length ? story.chapters[stage] : undefined;
  const concluded = !!story && stage >= story.chapters.length;

  useEffect(() => {
    const target = relatedSelection?.target;
    if (target?.kind === 'milestone' || target?.kind === 'story') {
      const valid = target.kind === 'milestone'
        ? available.milestones.some(item => item.id === target.id && item.organizationIds.includes(target.organizationId))
        : available.stories.some(item => item.id === target.id && item.chapters.some(chapter => chapter.organizationIds.includes(target.organizationId)));
      if (!valid) return;
      relatedSnapshot.current ??= { view, filters, selectedId, storyId, stage, origin: origin.current, chapterMilestone };
      setChapterMilestone(undefined);
      pendingFocus.current = true;
      if (target.kind === 'milestone') { setFilters(emptyFilters()); setSelectedId(target.id); setView('timeline'); }
      else { setStoryId(target.id); setStage(-1); setView('stories'); }
      const frame = requestAnimationFrame(() => (target.kind === 'milestone' ? detailHeading : storyHeading).current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    const previous = relatedSnapshot.current;
    if (previous) {
      relatedSnapshot.current = undefined; pendingFocus.current = false;
      setView(previous.view); setFilters(previous.filters); setSelectedId(previous.selectedId);
      setStoryId(previous.storyId); setStage(previous.stage); origin.current = previous.origin;
      setChapterMilestone(previous.chapterMilestone);
    }
  }, [relatedSelection, available]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    (view === 'stories' && story ? storyHeading : detailHeading).current?.focus();
    pendingFocus.current = false;
  }, [view, selected?.id, story?.id, stage]);

  const chooseMilestone = (id: string, fromStory = false) => {
    if (!fromStory && selected?.id === id && view === 'timeline') { detailHeading.current?.focus(); return; }
    if (fromStory) {
      setChapterMilestone({ id, filters, selectedId });
      setFilters(emptyFilters());
    }
    setSelectedId(id); setView('timeline'); pendingFocus.current = true;
  };
  const returnToChapter = () => {
    if (!chapterMilestone) return;
    setView('stories');
    setFilters(chapterMilestone.filters);
    setSelectedId(chapterMilestone.selectedId);
    setChapterMilestone(undefined);
    requestAnimationFrame(() => {
      const trigger = [...(explorer.current?.querySelectorAll<HTMLButtonElement>('[data-chapter-milestone]') ?? [])]
        .find(button => button.dataset.chapterMilestone === chapterMilestone.id);
      (trigger ?? storyHeading.current)?.focus();
    });
  };
  const openStory = (nextStory: HeritageStory) => {
    if (chapterMilestone && nextStory.id === storyId) { returnToChapter(); return; }
    setChapterMilestone(undefined);
    origin.current = { view, selectedId: selected?.id, filters: { ...filters }, storyId: nextStory.id, control: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    setStoryId(nextStory.id); setStage(-1); setView('stories'); pendingFocus.current = true;
  };
  const exitStory = () => {
    if (relatedSelection && onReturnRelated) { onReturnRelated(); return; }
    const previous = origin.current;
    setChapterMilestone(undefined);
    setStoryId(undefined); setStage(-1);
    if (previous) { setView(previous.view); setSelectedId(previous.selectedId); setFilters(previous.filters); }
    requestAnimationFrame(() => {
      if (previous?.control?.isConnected) previous.control.focus();
      else [...(explorer.current?.querySelectorAll<HTMLButtonElement>('button[data-heritage-story-id]') ?? [])].find(button => button.dataset.heritageStoryId === previous?.storyId)?.focus();
    });
  };
  const moveChapter = (next: number) => { setStage(next); pendingFocus.current = true; };
  const review = (reviewed: string) => <p className="heritage-review">{t.reviewed} · {t.reviewedDate}: <time dateTime={reviewed}>{reviewed}</time><br />{t.noEndorsement}</p>;
  const precision = (milestone: HistoricalMilestone) => <span className={`heritage-date-precision heritage-precision-${milestone.date.precision}`}>{t[milestone.date.precision]}</span>;
  const mappedPlaces = (ids: string[]) => {
    const places = resolveHeritagePlaces(ids, available.places, organizations);
    return <section className="heritage-related-places" aria-label={t.places}>
      <h4>{t.places}</h4>
      {!places.length && <p>{t.noPlace}</p>}
      {places.length > 1 && <button className="text-button" data-view-current-organizations={JSON.stringify(places.map(place => place.id))} onClick={event => { event.currentTarget.focus(); onViewMap(places); }}>{t.allPlaces}</button>}
      {places.map(organization => {
        const reference = available.places.find(place => place.organizationId === organization.id)!;
        return <article className="heritage-place" key={organization.id}>
          <h5>{organization.name}</h5><p className="heritage-current-address">{organization.district} · {organization.address}</p><p>{reference.relationship[language]}</p>
          <div className="heritage-place-actions">
            <button className="text-button" data-view-current-organizations={JSON.stringify([organization.id])} onClick={event => { event.currentTarget.focus(); onViewMap([organization]); }}>{t.currentMap}</button>
            <button className="primary-button" data-explore-organization={organization.id} onClick={event => { event.currentTarget.focus(); onExplore(organization); }}>{translations[language].exploreFaithSpace}</button>
            {getPlaceProfile(organization) && <button className="text-button" data-open-profile-organization={organization.id} onClick={event => { event.currentTarget.focus(); onOpenProfile(organization); }}>{t.profile}</button>}
          </div>
          <CulturalSourceList sources={reference.sources} language={language} headingLevel={6} />
        </article>;
      })}
    </section>;
  };
  const relatedRoutes = (selectedStory: HeritageStory) => {
    const routes = availableRoutes.filter(item => selectedStory.routeIds?.includes(item.route.id));
    if (!routes.length) return null;
    return <div className="heritage-related-routes">{routes.map(({ route }) => <button key={route.id} className="text-button" data-open-cultural-route={route.id} onClick={event => { event.currentTarget.focus(); onOpenRoute(route.id); }}>{t.route}: {route.title[language]}</button>)}</div>;
  };

  return <section className="heritage-explorer" aria-labelledby={headingId} ref={explorer}>
    <header className="heritage-header"><p className="eyebrow">{t.eyebrow}</p><h2 id={headingId}>{view === 'timeline' ? t.timeline : t.stories}</h2><p>{t.introduction}</p></header>
    <p className="heritage-distinction">{t.distinction}</p>
    <nav className="heritage-view-navigation" aria-label={t.views}>
      <button className="text-button" aria-current={view === 'timeline' ? 'page' : undefined} onClick={() => setView('timeline')}>{t.timeline}</button>
      <button className="text-button" aria-current={view === 'stories' ? 'page' : undefined} onClick={() => chapterMilestone ? returnToChapter() : setView('stories')}>{t.stories}</button>
    </nav>
    {view === 'timeline' ? <>
      {chapterMilestone && <button className="text-button heritage-chapter-return" onClick={returnToChapter}>{t.returnChapter}</button>}
      <div className="heritage-filters">
        <label>{t.religion}<select value={filters.religion} onChange={event => setFilters(current => ({ ...current, religion: event.target.value }))}><option value="">{t.all}</option>{religions.map(religion => <option key={religion} value={religion}>{religionLabels[language][religion]}</option>)}</select></label>
        <label>{t.district}<select value={filters.district} onChange={event => setFilters(current => ({ ...current, district: event.target.value }))}><option value="">{t.all}</option>{districts.map(district => <option key={district} value={district}>{district}</option>)}</select></label>
        <label>{t.theme}<select value={filters.theme} onChange={event => setFilters(current => ({ ...current, theme: event.target.value }))}><option value="">{t.all}</option>{(['foundation', 'architecture', 'community', 'heritage', 'transformation'] as const).map(theme => <option key={theme} value={theme}>{t[theme]}</option>)}</select></label>
        <button className="text-button" onClick={() => setFilters(emptyFilters())}>{t.clear}</button>
      </div>
      {!visible.length ? <p className="status-text">{t.empty}</p> : <div className="heritage-timeline-layout">
        <ol className="heritage-timeline" aria-label={t.timeline}>{visible.map(milestone => <li key={milestone.id} className={selected?.id === milestone.id ? 'is-selected' : undefined}>
          <div id={`${datePrefix}-${milestone.id}`}><p className="heritage-timeline-date">{formatHistoricalDate(milestone.date, language)}</p>{precision(milestone)}</div>
          <button aria-pressed={selected?.id === milestone.id} aria-describedby={`${datePrefix}-${milestone.id}`} aria-controls={detailId} onClick={() => chooseMilestone(milestone.id)}>{milestone.title[language]}</button>
        </li>)}</ol>
        {selected && <article className="heritage-milestone-detail" id={detailId} aria-labelledby={activeHeadingId}>
          <p className="eyebrow">{t.selected}</p><p className="heritage-detail-date">{formatHistoricalDate(selected.date, language)} {precision(selected)}</p>
          <h3 id={activeHeadingId} ref={detailHeading} tabIndex={-1}>{selected.title[language]}</h3><p>{selected.summary[language]}</p>
          <div className="heritage-step-actions"><button className="text-button" disabled={selectedIndex === 0} onClick={() => chooseMilestone(visible[selectedIndex - 1].id)}>{t.previous}</button><button className="text-button" disabled={selectedIndex === visible.length - 1} onClick={() => chooseMilestone(visible[selectedIndex + 1].id)}>{t.next}</button></div>
          <CulturalSourceList sources={selected.sources} language={language} />{review(selected.lastReviewed)}
          {mappedPlaces(selected.organizationIds)}
          {selected.storyIds.length > 0 && <section className="heritage-related-stories"><h4>{t.relatedStories}</h4>{selected.storyIds.map(id => available.stories.find(item => item.id === id)).filter((item): item is HeritageStory => !!item).map(item => <button key={item.id} data-heritage-story-id={item.id} className="text-button" onClick={event => { event.currentTarget.focus(); openStory(item); }}>{t.readStory}: {item.title[language]}</button>)}</section>}
        </article>}
      </div>}
    </> : !story ? <div className="heritage-story-list">
      {!available.stories.length && <p className="status-text">{t.storyEmpty}</p>}
      {available.stories.map(item => <article className="heritage-story-card" key={item.id}><p className="eyebrow">{t.sourceBased} · {t.chapters(item.chapters.length)}</p><h3>{item.title[language]}</h3><p className="heritage-story-subtitle">{item.subtitle[language]}</p><p>{item.introduction[language]}</p><button data-heritage-story-id={item.id} className="primary-button" onClick={event => { event.currentTarget.focus(); openStory(item); }}>{t.readStory}: {item.title[language]}</button></article>)}
    </div> : <article className="heritage-story-viewer">
      <header className="heritage-story-heading"><div><p className="heritage-story-subtitle">{story.subtitle[language]}</p><h3>{story.title[language]}</h3></div><button className="text-button" onClick={exitStory}>{t.exit}</button></header>
      <p className="heritage-chapter-progress" role="status" aria-atomic="true">{stage < 0 ? t.introductionStage : concluded ? t.conclusion : t.chapter(stage + 1, story.chapters.length)}</p>
      <div className="heritage-chapter-track" aria-hidden="true"><span style={{ width: `${stage < 0 ? 0 : concluded ? 100 : (stage + 1) / story.chapters.length * 100}%` }} /></div>
      <div className="heritage-chapter-content">
        <h4 ref={storyHeading} tabIndex={-1}>{stage < 0 ? t.introductionStage : chapter ? chapter.title[language] : t.conclusion}</h4>
        {stage < 0 ? <><p>{story.introduction[language]}</p><CulturalSourceList sources={story.sources} language={language} headingLevel={5} />{review(story.lastReviewed)}</> : chapter ? <>
          <p>{chapter.content[language]}</p>
          {chapter.milestoneIds.length > 0 && <section className="heritage-chapter-milestones"><h5>{t.relatedMilestones}</h5>{chapter.milestoneIds.map(id => available.milestones.find(item => item.id === id)).filter((item): item is HistoricalMilestone => !!item).map(milestone => <article key={milestone.id}><p className="heritage-timeline-date">{formatHistoricalDate(milestone.date, language)} {precision(milestone)}</p><h6>{milestone.title[language]}</h6><p>{milestone.summary[language]}</p><button className="text-button" data-chapter-milestone={milestone.id} onClick={() => chooseMilestone(milestone.id, true)}>{t.onTimeline}: {milestone.title[language]}</button><CulturalSourceList sources={milestone.sources} language={language} headingLevel={6} /></article>)}</section>}
          {mappedPlaces(chapter.organizationIds)}<CulturalSourceList sources={chapter.sources} language={language} headingLevel={5} />
        </> : <><p>{story.conclusion?.[language] ?? t.complete}</p><CulturalSourceList sources={story.sources} language={language} headingLevel={5} />{review(story.lastReviewed)}</>}
      </div>
      {relatedRoutes(story)}
      <nav className="heritage-story-actions" aria-label={t.stories}>
        <button className="text-button" disabled={stage < 0} onClick={() => moveChapter(stage - 1)}>{t.previousChapter}</button>
        {concluded ? <button className="primary-button" onClick={() => moveChapter(-1)}>{t.restart}</button> : <button className="primary-button" onClick={() => moveChapter(stage + 1)}>{stage < 0 ? t.start : stage === story.chapters.length - 1 ? t.finish : t.nextChapter}</button>}
      </nav>
    </article>}
  </section>;
}
