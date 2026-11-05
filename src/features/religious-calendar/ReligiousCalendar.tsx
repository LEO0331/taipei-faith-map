import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language, ReligiousOrganization } from '../../types';
import { RELIGION_TYPES } from '../../utils/data';
import { religionLabels } from '../../utils/i18n';
import { CulturalSourceList } from '../faith-spaces/CulturalSourceList';
import { getSafeSourceUrl } from '../faith-spaces/culturalSources';
import { culturalEvents } from './culturalEvents';
import { calendarLabels } from './calendarLabels';
import { resolveCulturalEvents } from './calendarValidation';
import { buildFestivalReferences, organizationMatchesFilters } from './festivalReferences';
import { eventOccursOn, eventsInMonth, formatCalendarDate, formatCalendarMonth, getTaipeiToday, isRecentVerification, monthDays, shiftMonth, upcomingEvents } from './calendarUtils';
import type { CalendarFilters, ResolvedCalendarEvent } from './calendarTypes';
import type { RelatedSelectionRequest } from '../../components/relatedContentTypes';
import './calendar.css';

type Props = {
  organizations: ReligiousOrganization[];
  language: Language;
  onViewMap: (organization: ReligiousOrganization) => void;
  onExplore: (organization: ReligiousOrganization) => void;
  relatedSelection?: RelatedSelectionRequest;
};

export default function ReligiousCalendar({ organizations, language, onViewMap, onExplore, relatedSelection }: Props) {
  const [today, setToday] = useState(() => getTaipeiToday());
  const [month, setMonth] = useState(() => getTaipeiToday().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(() => getTaipeiToday());
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [compact, setCompact] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches);
  const effectiveView = compact ? 'agenda' : view;
  const [filters, setFilters] = useState<CalendarFilters>({ religion: '', district: '', keyword: '' });
  const [selectedEventId, setSelectedEventId] = useState<string>();
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>();
  const [referenceLimit, setReferenceLimit] = useState(20);
  const headingId = useId();
  const monthHeadingId = useId();
  const detailPanel = useRef<HTMLElement>(null);
  const relatedSnapshot = useRef<{ month: string; selectedDate: string; view: 'month' | 'agenda'; filters: CalendarFilters; selectedEventId?: string; selectedReferenceId?: string; referenceLimit: number } | undefined>(undefined);
  const t = calendarLabels[language];
  const byId = useMemo(() => new Map(organizations.map(organization => [organization.id, organization])), [organizations]);
  const references = useMemo(() => buildFestivalReferences(organizations), [organizations]);
  const resolved = useMemo(() => resolveCulturalEvents(culturalEvents, organizations), [organizations]);
  const filteredEvents = resolved.filter(({ event, organization }) => organizationMatchesFilters(organization, filters, `${event.title.zh} ${event.title.en} ${event.description.zh} ${event.description.en}`));
  const monthEvents = eventsInMonth(filteredEvents.map(item => item.event), month);
  const selectedDayEvents = monthEvents.filter(event => eventOccursOn(event, selectedDate));
  const upcoming = upcomingEvents(filteredEvents.map(item => item.event), today);
  const filteredReferences = references.filter(reference => {
    const organization = byId.get(reference.organizationId);
    return organization && organizationMatchesFilters(organization, filters, reference.originalDateText);
  });
  const eventSelection = filteredEvents.find(item => item.event.id === selectedEventId);
  const referenceSelection = filteredReferences.find(item => item.id === selectedReferenceId);
  const referenceOrganization = referenceSelection && byId.get(referenceSelection.organizationId);

  useEffect(() => {
    if (relatedSelection?.target.kind === 'event') {
      const match = resolved.find(item => item.event.id === relatedSelection.target.id && item.organization.id === relatedSelection.target.organizationId);
      if (!match) return;
      relatedSnapshot.current ??= { month, selectedDate, view, filters, selectedEventId, selectedReferenceId, referenceLimit };
      setFilters({ religion: '', district: '', keyword: '' });
      setMonth(match.event.startDate.slice(0, 7));
      setSelectedDate(match.event.startDate);
      setSelectedEventId(match.event.id);
      setSelectedReferenceId(undefined);
      const frame = requestAnimationFrame(() => detailPanel.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    const previous = relatedSnapshot.current;
    if (previous) {
      relatedSnapshot.current = undefined;
      setMonth(previous.month); setSelectedDate(previous.selectedDate); setView(previous.view); setFilters(previous.filters);
      setSelectedEventId(previous.selectedEventId); setSelectedReferenceId(previous.selectedReferenceId); setReferenceLimit(previous.referenceLimit);
    }
    // A new request is an explicit visit; language and local reading changes do not replay it.
  }, [relatedSelection, resolved]);

  useEffect(() => {
    const update = () => setToday(getTaipeiToday());
    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(max-width: 600px)');
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (selectedEventId || selectedReferenceId) detailPanel.current?.focus();
  }, [selectedEventId, selectedReferenceId]);

  const changeMonth = (next: string) => { setMonth(next); setSelectedDate(`${next}-01`); setSelectedEventId(undefined); setSelectedReferenceId(undefined); };
  const updateFilter = (key: keyof CalendarFilters, value: string) => { setFilters(current => ({ ...current, [key]: value })); setReferenceLimit(20); setSelectedEventId(undefined); setSelectedReferenceId(undefined); };
  const chooseEvent = (id: string) => { setSelectedEventId(id); setSelectedReferenceId(undefined); };
  const actions = (organization: ReligiousOrganization) => <div className="calendar-place-actions">
    <button className="text-button" onClick={() => onViewMap(organization)}>{t.map}</button>
    <button className="primary-button" data-explore-organization={organization.id} onClick={event => { event.currentTarget.focus(); onExplore(organization); }}>{t.explore}</button>
  </div>;
  const eventButton = (id: string) => {
    const event = filteredEvents.find(item => item.event.id === id)?.event;
    if (!event) return null;
    return <button className="calendar-event-entry" key={event.id} aria-pressed={selectedEventId === event.id} onClick={() => chooseEvent(event.id)}>
      <span className={`calendar-status calendar-status-${event.status}`}>{t[event.status]}</span>
      <strong>{event.title[language]}</strong>
      <span>{formatCalendarDate(event.startDate, language)}{event.endDate !== event.startDate ? ` — ${formatCalendarDate(event.endDate, language)}` : ''}</span>
      {event.endDate < today && <span>{t.historical}</span>}
      <small>{isRecentVerification(event.verifiedAt, today) ? t.recent : t.older} · {event.verifiedAt}</small>
    </button>;
  };

  const cells = monthDays(month);
  return <section className="religious-calendar" aria-labelledby={headingId}>
    <header className="discovery-heading"><p className="eyebrow">{language === 'zh' ? '日期、來源與場所' : 'DATES, EVIDENCE & PLACES'}</p><h2 id={headingId}>{t.title}</h2><p>{t.subtitle}</p></header>
    <div className="calendar-filters">
      <label>{t.religion}<select value={filters.religion} onChange={event => updateFilter('religion', event.target.value)}><option value="">{t.all}</option>{RELIGION_TYPES.map(religion => <option key={religion} value={religion}>{religionLabels[language][religion]}</option>)}</select></label>
      <label>{t.district}<select value={filters.district} onChange={event => updateFilter('district', event.target.value)}><option value="">{t.all}</option>{[...new Set(organizations.map(item => item.district))].sort().map(district => <option key={district} value={district}>{district}</option>)}</select></label>
      <label>{t.search}<input type="search" value={filters.keyword} onChange={event => updateFilter('keyword', event.target.value)} /></label>
    </div>
    <p className="calendar-evidence-note">{t.calendarNote}</p>
    <div className="calendar-content">
      <div className="calendar-month-panel">
        <div className="calendar-month-navigation">
          <button className="text-button" aria-label={t.previous} onClick={() => changeMonth(shiftMonth(month, -1))}>←</button>
          <h3 id={monthHeadingId} aria-live="polite">{formatCalendarMonth(month, language)}</h3>
          <button className="text-button" aria-label={t.next} onClick={() => changeMonth(shiftMonth(month, 1))}>→</button>
          <button className="text-button calendar-current-month" onClick={() => { changeMonth(today.slice(0, 7)); setSelectedDate(today); }}>{t.current}</button>
        </div>
        <div className="calendar-view-switch" role="group" aria-label={t.view}>
          {!compact && <button className="text-button" aria-pressed={effectiveView === 'month'} onClick={() => setView('month')}>{t.monthView}</button>}
          <button className="text-button" aria-pressed={effectiveView === 'agenda'} onClick={() => setView('agenda')}>{t.agendaView}</button>
        </div>
        {effectiveView === 'month' ? <>
          <table className="calendar-month" aria-labelledby={monthHeadingId}>
            <thead><tr>{t.weekdays.map(day => <th scope="col" key={day}>{day}</th>)}</tr></thead>
            <tbody>{Array.from({ length: cells.length / 7 }, (_, week) => <tr key={week}>{cells.slice(week * 7, week * 7 + 7).map((date, column) => {
              const count = date ? monthEvents.filter(event => eventOccursOn(event, date)).length : 0;
              return <td key={date ?? `blank-${column}`}>{date && <button className="calendar-day" aria-current={date === today ? 'date' : undefined} aria-pressed={date === selectedDate} aria-label={`${formatCalendarDate(date, language)}${date === today ? ` · ${t.today}` : ''} · ${count} ${t.entries}`} onClick={() => { setSelectedDate(date); setSelectedEventId(undefined); setSelectedReferenceId(undefined); }}>
                <span>{Number(date.slice(-2))}</span>{count > 0 && <small aria-hidden="true">{count}</small>}
              </button>}</td>;
            })}</tr>)}</tbody>
          </table>
          <section className="calendar-day-agenda" aria-label={t.selectedDate}>
            <h4>{formatCalendarDate(selectedDate, language)}</h4>{selectedDayEvents.length ? selectedDayEvents.map(event => eventButton(event.id)) : <p className="status-text">{t.noDayEvents}</p>}
          </section>
        </> : <div className="calendar-agenda" aria-labelledby={monthHeadingId}>{monthEvents.length ? monthEvents.map(event => eventButton(event.id)) : <p className="status-text">{t.noEvents}</p>}</div>}
        {effectiveView === 'month' && !monthEvents.length && <p className="calendar-empty">{t.noEvents}</p>}
        <section className="calendar-upcoming" aria-label={t.upcoming}><h3>{t.upcoming}</h3>{upcoming.length ? upcoming.map(event => eventButton(event.id)) : <p className="status-text">{t.noUpcoming}</p>}</section>
      </div>
      <aside className="calendar-details" ref={detailPanel} tabIndex={-1} aria-label={eventSelection?.event.title[language] ?? referenceOrganization?.name ?? (language === 'zh' ? '日曆項目說明' : 'Calendar entry details')}>
        {eventSelection ? <CalendarEventDetails selection={eventSelection} language={language} today={today} actions={actions} /> : referenceSelection && referenceOrganization ? <>
          <p className="eyebrow">{t.references}</p><h3>{referenceOrganization.name}</h3>
          <p className="calendar-status">{t[referenceSelection.calendarSystem]}</p>
          <h4>{t.original}</h4><blockquote>{referenceSelection.originalDateText}</blockquote>
          <p>{t.unparsed}</p><p className="calendar-evidence-note">{t.referenceNote}</p><p>{t.lunarNote}</p>
          <p>{religionLabels[language][referenceOrganization.religion]} · {referenceOrganization.district}</p><p>{referenceOrganization.address}</p>
          <p className="calendar-source">{t.source}: {referenceOrganization.source}</p>{actions(referenceOrganization)}
        </> : <p className="status-text">{t.selectEvent}</p>}
      </aside>
    </div>
    <section className="festival-references" aria-label={t.references}>
      <div className="section-heading"><div><h3>{t.references}</h3><p>{filteredReferences.length.toLocaleString()} {t.referenceCount}</p></div></div>
      <p className="calendar-evidence-note">{t.referenceNote}</p><p className="calendar-reference-note">{t.lunarNote}</p>
      <div className="festival-reference-list">{filteredReferences.slice(0, referenceLimit).map(reference => {
        const organization = byId.get(reference.organizationId)!;
        return <button className="festival-reference" key={reference.id} aria-pressed={selectedReferenceId === reference.id} onClick={() => { setSelectedReferenceId(reference.id); setSelectedEventId(undefined); }}><span className="calendar-status">{t[reference.calendarSystem]}</span><strong>{organization.name}</strong><span lang="zh-Hant">{reference.originalDateText}</span><small>{organization.district} · {religionLabels[language][organization.religion]}</small></button>;
      })}</div>
      {!filteredReferences.length && <p className="status-text">{t.noReferences}</p>}
      {filteredReferences.length > referenceLimit && <button className="text-button" onClick={() => setReferenceLimit(limit => limit + 20)}>{t.more}</button>}
    </section>
  </section>;
}

function CalendarEventDetails({ selection: { event, organization }, language, today, actions }: { selection: ResolvedCalendarEvent; language: Language; today: string; actions: (organization: ReligiousOrganization) => ReactNode }) {
  const t = calendarLabels[language];
  const officialUrl = getSafeSourceUrl(event.sources[0]?.url ?? '');
  const registrationUrl = event.registrationUrl && getSafeSourceUrl(event.registrationUrl);
  return <>
    <p className="eyebrow">{t.evidence}</p><h3>{event.title[language]}</h3><p className={`calendar-status calendar-status-${event.status}`}>{t[event.status]}{event.endDate < today ? ` · ${t.historical}` : ''}</p>
    <p>{event.description[language]}</p><dl className="calendar-event-facts">
      <div><dt>{t.dates}</dt><dd><time dateTime={event.startDate}>{formatCalendarDate(event.startDate, language)}</time>{event.endDate !== event.startDate && <> — <time dateTime={event.endDate}>{formatCalendarDate(event.endDate, language)}</time></>}</dd></div>
      <div><dt>{t.timeZone}</dt><dd>{event.startTime ? `${event.startTime}${event.endTime ? ` — ${event.endTime}` : ''}` : t.dateOnly}</dd></div>
      <div><dt>{t.location}</dt><dd>{event.location[language]}</dd></div>
      <div><dt>{t.registeredAddress}</dt><dd>{organization.name} · {organization.district}<br />{organization.address}</dd></div>
      <div><dt>{t.religion}</dt><dd>{religionLabels[language][organization.religion]}</dd></div>
      <div><dt>{t.attendance}</dt><dd>{event.attendance === 'unknown' ? t.unknownAttendance : t[event.attendance]}</dd></div>
    </dl>
    <p className="calendar-source">{t.verified}: <time dateTime={event.verifiedAt}>{event.verifiedAt}</time></p><p className="calendar-reference-note">{isRecentVerification(event.verifiedAt, today) ? t.recent : t.older}</p><p className="calendar-reference-note">{t.sourceAge}</p>
    <CulturalSourceList sources={event.sources} language={language} />
    <div className="calendar-external-actions">{officialUrl && <a href={officialUrl} target="_blank" rel="noopener noreferrer">{t.official} · {new URL(officialUrl).hostname} ↗</a>}{registrationUrl && <a href={registrationUrl} target="_blank" rel="noopener noreferrer">{t.registration} · {new URL(registrationUrl).hostname} ↗</a>}</div>
    {actions(organization)}<p className="calendar-reference-note">{t.internal}</p>
  </>;
}
