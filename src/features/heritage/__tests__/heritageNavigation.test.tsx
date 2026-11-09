// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReligiousOrganization } from '../../../types';
import type { HeritageContent, HistoricalDate, HistoricalMilestone } from '../heritageTypes';
import HeritageExplorer from '../HeritageExplorer';

vi.mock('../../faith-spaces/placeProfileLookup', () => ({ getPlaceProfile: (organization: ReligiousOrganization) => organization.id === 'place-a' ? { id: 'verified-test-profile' } : undefined }));
vi.mock('../../cultural-routes/routeLookup', () => ({ getAvailableRoutes: () => [{ route: { id: 'wanhua-temple-heritage', title: { zh: '測試路線', en: 'Test route' } } }] }));

const copy = (zh: string, en: string) => ({ zh, en });
const source = { id: 'source', title: copy('測試歷史來源', 'Test historical source'), url: 'https://example.org/history', publisher: 'Test archive', verifiedAt: '2026-11-04' };
const organizations: ReligiousOrganization[] = [
  { id: 'place-a', name: '測試歷史場所甲', religion: '道教', district: '萬華區', address: '測試街1號', latitude: 25.04, longitude: 121.5, originalX: 0, originalY: 0, festivalDates: [], source: 'Test dataset' },
  { id: 'place-b', name: '測試歷史場所乙', religion: '回教', district: '中正區', address: '測試街2號', latitude: 25.03, longitude: 121.51, originalX: 0, originalY: 0, festivalDates: [], source: 'Test dataset' },
];
const date = (precision: HistoricalDate['precision'], zh: string, en: string, years: Partial<HistoricalDate> = {}): HistoricalDate => ({ precision, calendarSystem: 'gregorian', displayLabel: copy(zh, en), ...years });
const milestone = (id: string, title: string, historicalDate: HistoricalDate, organizationIds: string[], storyIds: string[] = ['story']): HistoricalMilestone => ({
  id, title: copy(`${title}（中）`, title), summary: copy(`${title}的來源敘述。`, `Published evidence for ${title}.`), date: historicalDate,
  theme: 'community', organizationIds, storyIds, sources: [source], lastReviewed: '2026-11-04', editorialReviewStatus: 'internal-reviewed',
});
const content: HeritageContent = {
  milestones: [
    milestone('exact', 'Recorded exact milestone', date('exact', '1900年1月2日', '2 January 1900', { startYear: 1900, exactDate: '1900-01-02' }), ['place-b']),
    { ...milestone('unknown', 'Unmapped historical context', date('unknown', '確切年代未詳', 'Date not established'), []), religions: ['回教'], districts: ['中正區'] },
    milestone('range', 'Recorded year range', date('range', '1700至1710年', '1700–1710', { startYear: 1700, endYear: 1710 }), ['place-a']),
    milestone('year', 'Recorded year milestone', date('year', '1850年', '1850', { startYear: 1850 }), ['place-b']),
    milestone('approximate', 'Approximate historical milestone', date('approximate', '約1800年', 'Around 1800', { startYear: 1800 }), ['place-a'], []),
  ],
  places: organizations.map(organization => ({ organizationId: organization.id, organizationName: organization.name, district: organization.district, address: organization.address,
    relationship: copy('目前登記場所與史料有關，不代表歷史座標或法人沿革相同。', 'This current registration is related to the sources; it does not establish historical coordinates or legal continuity.'), sources: [source] })),
  stories: [{
    id: 'story', title: copy('來源閱讀故事', 'A story from sources'), subtitle: copy('建築與社群分開閱讀', 'Read buildings and communities separately'),
    introduction: copy('藉由史料與現址認識歷史。', 'Follow evidence and current places without conflating them.'), theme: 'history', sources: [source], lastReviewed: '2026-11-04', editorialReviewStatus: 'internal-reviewed', routeIds: ['wanhua-temple-heritage'],
    chapters: [
      { id: 'one', title: copy('第一章：史料背景', 'Chapter one: historical context'), content: copy('這章可在沒有現代場所連結時閱讀。', 'This chapter can be read without an associated current place.'), milestoneIds: ['unknown'], organizationIds: [], sources: [source] },
      { id: 'two', title: copy('第二章：場所甲', 'Chapter two: place A'), content: copy('對照來源與目前登記場所。', 'Compare the sources with the current registered place.'), milestoneIds: ['range'], organizationIds: ['place-a'], sources: [source] },
      { id: 'three', title: copy('第三章：場所乙', 'Chapter three: place B'), content: copy('區分年份與確切日期。', 'Distinguish a reported year from an exact date.'), milestoneIds: ['year', 'exact'], organizationIds: ['place-b'], sources: [source] },
    ],
  }],
};
const props = { organizations, data: content, language: 'en' as const, onViewMap: vi.fn(), onExplore: vi.fn(), onOpenProfile: vi.fn(), onOpenRoute: vi.fn() };
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => { vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)); });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe('heritage timeline and stories', () => {
  it('focuses the detail heading when the default or already active milestone is selected again', () => {
    render(<HeritageExplorer {...props} />);
    const active = screen.getByRole('button', { name: 'Recorded year range' });
    const heading = screen.getByRole('heading', { name: 'Recorded year range' });
    expect(active.getAttribute('aria-pressed')).toBe('true');
    active.focus();
    fireEvent.click(active);
    expect(document.activeElement).toBe(heading);
    active.focus();
    fireEvent.click(active);
    expect(document.activeElement).toBe(heading);
  });

  it('shows a chronological vertical timeline with each source date’s precision intact', () => {
    render(<HeritageExplorer {...props} />);
    const timeline = screen.getByRole('list', { name: 'Historical Timeline' });
    expect(within(timeline).getAllByRole('button').map(button => button.textContent)).toEqual(['Recorded year range', 'Approximate historical milestone', 'Recorded year milestone', 'Recorded exact milestone', 'Unmapped historical context']);
    expect(within(timeline).getByText('Around 1800')).toBeTruthy();
    expect(within(timeline).getByText('Approximate date')).toBeTruthy();
    expect(within(timeline).getByText('1700–1710')).toBeTruthy();
    expect(within(timeline).getByText('Year range')).toBeTruthy();
    expect(within(timeline).getByText('Date uncertain')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Previous milestone' }) as HTMLButtonElement).disabled).toBe(true);
    click('Next milestone');
    expect(screen.getByRole('button', { name: 'Approximate historical milestone' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement?.textContent).toBe('Approximate historical milestone');
    click('Recorded exact milestone');
    expect(screen.getByRole('button', { name: 'Recorded exact milestone' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText('2 January 1900').length).toBeGreaterThan(0);
  });

  it('filters by religion, district and theme while retaining independently classified unmapped context', () => {
    render(<HeritageExplorer {...props} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Religion' }), { target: { value: '回教' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'District' }), { target: { value: '中正區' } });
    expect(screen.queryByRole('button', { name: 'Recorded year range' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Unmapped historical context' })).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Historical theme' }), { target: { value: 'foundation' } });
    expect(screen.getByText('No reviewed historical content matches these filters.')).toBeTruthy();
    click('Clear timeline filters');
    expect(screen.getByRole('button', { name: 'Recorded year range' })).toBeTruthy();
  });

  it('uses only matched current places for map, Faith Space and verified profile actions', () => {
    render(<HeritageExplorer {...props} />);
    click('View current registered location');
    expect(props.onViewMap).toHaveBeenCalledExactlyOnceWith([organizations[0]]);
    click('Explore Faith Space');
    expect(props.onExplore).toHaveBeenCalledExactlyOnceWith(organizations[0]);
    click('Open verified place profile');
    expect(props.onOpenProfile).toHaveBeenCalledExactlyOnceWith(organizations[0]);
    expect(screen.getByText(/Map links show current registered locations/)).toBeTruthy();
    click('Recorded exact milestone');
    expect(screen.queryByRole('button', { name: 'Open verified place profile' })).toBeNull();
    const sources = screen.getAllByRole('link');
    expect(sources.every(link => link.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
    expect(sources.every(link => link.getAttribute('href') === source.url)).toBe(true);
  });

  it('lists stories, navigates an unmapped chapter, finishes and links an existing cultural route', () => {
    render(<HeritageExplorer {...props} />);
    click('Heritage Stories');
    expect(screen.getByRole('heading', { name: 'A story from sources' })).toBeTruthy();
    click('Read story: A story from sources');
    expect(screen.getByRole('status').textContent).toBe('Story introduction');
    expect((screen.getByRole('button', { name: 'Previous chapter' }) as HTMLButtonElement).disabled).toBe(true);
    click('Start chapters');
    expect(screen.getByRole('status').textContent).toBe('Chapter 1 of 3');
    expect(screen.getByText('No safely matched current registered place is linked here. You can still read the history and its sources.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'View current registered location' })).toBeNull();
    click('Next chapter');
    expect(screen.getByRole('status').textContent).toBe('Chapter 2 of 3');
    click('Previous chapter');
    expect(screen.getByRole('status').textContent).toBe('Chapter 1 of 3');
    click('Next chapter'); click('Next chapter'); click('Read conclusion');
    expect(screen.getByRole('status').textContent).toBe('Story conclusion');
    click('Explore related cultural walking route: Test route');
    expect(props.onOpenRoute).toHaveBeenCalledExactlyOnceWith('wanhua-temple-heritage');
    click('Read again');
    expect(screen.getByRole('status').textContent).toBe('Story introduction');
  });

  it('preserves the active milestone, story chapter and explicit date labels across languages', () => {
    const { rerender } = render(<HeritageExplorer {...props} />);
    click('Recorded exact milestone');
    rerender(<HeritageExplorer {...props} language="zh" />);
    expect(screen.getByRole('button', { name: 'Recorded exact milestone（中）' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getAllByText('1900年1月2日').length).toBeGreaterThan(0);
    click('閱讀故事: 來源閱讀故事'); click('開始閱讀章節'); click('下一章');
    rerender(<HeritageExplorer {...props} language="en" />);
    expect(screen.getByRole('status').textContent).toBe('Chapter 2 of 3');
    expect(screen.getByRole('heading', { name: 'Chapter two: place A' })).toBeTruthy();
    click('View current registered location');
    expect(props.onViewMap).toHaveBeenCalledExactlyOnceWith([organizations[0]]);
    click('Explore Faith Space');
    expect(props.onExplore).toHaveBeenCalledExactlyOnceWith(organizations[0]);
  });

  it('restores the original timeline selection, filters and invoking story control on exit', async () => {
    render(<HeritageExplorer {...props} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Religion' }), { target: { value: '回教' } });
    click('Unmapped historical context');
    click('Read story: A story from sources');
    click('Start chapters'); click('Next chapter');
    click('Exit story');
    expect(screen.getByRole('heading', { name: 'Historical Timeline' })).toBeTruthy();
    expect((screen.getByRole('combobox', { name: 'Religion' }) as HTMLSelectElement).value).toBe('回教');
    expect(screen.getByRole('button', { name: 'Unmapped historical context' }).getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Read story: A story from sources' })));
  });

  it('returns from a chapter milestone to the same reading position and control', async () => {
    render(<HeritageExplorer {...props} />);
    click('Heritage Stories'); click('Read story: A story from sources'); click('Start chapters');
    click('Read on the timeline: Unmapped historical context');
    expect(screen.getByRole('heading', { name: 'Historical Timeline' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Unmapped historical context' }).getAttribute('aria-pressed')).toBe('true');
    click('Return to reading chapter');
    expect(screen.getByRole('status').textContent).toBe('Chapter 1 of 3');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Read on the timeline: Unmapped historical context' })));
  });

  it('withholds invalid evidence rather than presenting unsafe history or navigation actions', () => {
    const invalid = structuredClone(content);
    invalid.milestones[0].sources[0].url = 'javascript:alert(1)';
    render(<HeritageExplorer {...props} data={invalid} />);
    expect(screen.getByText('No reviewed historical content matches these filters.')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button', { name: 'View current registered location' })).toBeNull();
    click('Heritage Stories');
    expect(screen.getByText('No reviewed heritage stories are currently available.')).toBeTruthy();
  });
});
