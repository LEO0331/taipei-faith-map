// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { MapFocusRequest } from './components/ReligiousOrganizationMap';
import type { ReligiousOrganization } from './types';
import { App } from './App';
import governmentData from '../public/data/religious-organizations.json';
import { placeProfiles } from './features/faith-spaces/placeProfiles';
import { culturalEvents } from './features/religious-calendar/culturalEvents';
import { culturalRoutes } from './features/cultural-routes/culturalRoutes';
import { historicalMilestones } from './features/heritage/historicalMilestones';
import { heritageStories } from './features/heritage/heritageStories';
import { heritageOrganizations } from './features/heritage/heritageOrganizations';

const lifecycle = vi.hoisted(() => ({ mounted: 0, unmounted: 0 }));
type MapProps = {
  items: ReligiousOrganization[];
  routeStops?: ReligiousOrganization[];
  selectedRouteStopId?: string;
  onRouteStopSelect?: (id: string) => void;
  focusRequest?: MapFocusRequest;
  visible?: boolean;
};
vi.mock('./components/ReligiousOrganizationMap', async () => {
  const React = await import('react');
  return {
    ReligiousOrganizationMap: ({ items, routeStops, selectedRouteStopId, onRouteStopSelect, focusRequest, visible }: MapProps) => {
      React.useEffect(() => { lifecycle.mounted++; return () => { lifecycle.unmounted++; }; }, []);
      return <div data-testid="related-map" data-visible={String(visible)} data-filtered-ids={items.map(item => item.id).join(',')}
        data-focus-id={focusRequest?.organization.id ?? ''} data-selected-stop={selectedRouteStopId ?? ''}
        data-focus-temporary={String(!!focusRequest?.temporary)} data-focus-historical={String(focusRequest?.historical)}
        data-route-ids={routeStops?.map(stop => stop.id).join(',') ?? ''}>
        {routeStops?.map(stop => <button key={stop.id} onClick={() => onRouteStopSelect?.(stop.id)}>Map stop: {stop.name}</button>)}
      </div>;
    },
  };
});

const ids = new Set([
  ...placeProfiles.map(profile => profile.organizationId),
  ...heritageOrganizations.map(place => place.organizationId),
  ...culturalRoutes.flatMap(route => route.stops.map(stop => stop.organizationId)),
]);
const organizations = (governmentData as ReligiousOrganization[]).filter(organization => ids.has(organization.id));
const qingshan = organizations.find(organization => organization.id === 'org-21-1bs6r0m')!;
const lungshan = organizations.find(organization => organization.id === 'org-83-1arg2kq')!;
const event = culturalEvents.find(item => item.organizationId === qingshan.id)!;
const route = culturalRoutes.find(item => item.id === 'wanhua-temple-heritage')!;
const story = heritageStories.find(item => item.id === 'bangka-building-layers')!;
const milestone = historicalMilestones.find(item => item.id === 'lungshan-foundation-1738')!;

beforeEach(() => {
  localStorage.clear(); lifecycle.mounted = 0; lifecycle.unmounted = 0;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-05T04:00:00Z'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => organizations }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const navigation = () => screen.getByRole('navigation', { name: /探索台北信仰文化|Explore Taipei faith and culture/ });
const navigate = (name: string) => fireEvent.click(within(navigation()).getByRole('button', { name }));
const map = () => screen.getByTestId('related-map');
const returnProfile = () => screen.getByRole('button', { name: /^(返回場所介紹|Return to place profile)$/ });
async function profileDialog(organization: ReligiousOrganization, language: 'zh' | 'en' = 'zh') {
  const dialog = await screen.findByRole('dialog', { name: organization.name });
  const about = within(dialog).getByRole('button', { name: language === 'zh' ? '認識這個場所' : 'About This Place' });
  if (about.getAttribute('aria-pressed') !== 'true') fireEvent.click(about);
  const related = await within(dialog).findByRole('region', { name: language === 'zh' ? '相關文化探索' : 'Related Cultural Content' });
  return { dialog, related };
}
async function openQingshanFromMap() {
  await screen.findByRole('heading', { name: qingshan.name });
  fireEvent.change(screen.getByRole('combobox', { name: '行政區' }), { target: { value: '萬華區' } });
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '青山宮' } });
  const opener = screen.getByRole('button', { name: '探索信仰空間' });
  opener.focus(); fireEvent.click(opener);
  return { opener, ...(await profileDialog(qingshan)) };
}

describe('Place profile related cultural navigation', () => {
  it('provides a bilingual skip link to the existing main landmark without remounting the map', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: qingshan.name });
    const main = screen.getByRole('main');
    const skip = screen.getByRole('link', { name: '跳至主要內容' });
    expect(document.getElementById(skip.getAttribute('href')!.slice(1))).toBe(main);
    expect(main.tabIndex).toBe(-1);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBe(skip);
    expect(within(navigation()).getByRole('button', { name: 'Map' }).getAttribute('aria-current')).toBe('page');
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });
  it('opens the real related event from a map profile and returns to About with original filters, focus and map instance', async () => {
    render(<App />);
    const { opener, related } = await openQingshanFromMap();
    const originalMap = map();
    const filteredIds = originalMap.getAttribute('data-filtered-ids');
    fireEvent.click(within(related).getByRole('button', { name: new RegExp(event.title.zh) }));
    await screen.findByRole('complementary', { name: event.title.zh });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: '2026年11月' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '2026年11月28日 · 1 則活動公告' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(navigation()).getByRole('button', { name: '行事曆' }).getAttribute('aria-current')).toBe('page');
    // Related destinations permit ordinary reading, but cannot create another return stack.
    fireEvent.click(screen.getByRole('button', { name: '探索信仰空間' }));
    const destinationDialog = await screen.findByRole('dialog', { name: qingshan.name });
    fireEvent.click(within(destinationDialog).getByRole('button', { name: '認識這個場所' }));
    expect(within(destinationDialog).queryByRole('region', { name: '相關文化探索' })).toBeNull();
    fireEvent.keyDown(destinationDialog, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: '地圖查看' }));
    expect(map().getAttribute('data-focus-id')).toBe(qingshan.id);
    expect(map().getAttribute('data-focus-temporary')).toBe('true');
    expect(map().getAttribute('data-focus-historical')).toBe('false');
    fireEvent.click(returnProfile());
    const returned = await screen.findByRole('dialog', { name: qingshan.name });
    expect(within(returned).getByRole('button', { name: '認識這個場所' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(returned, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(map()).toBe(originalMap);
    expect(map().getAttribute('data-filtered-ids')).toBe(filteredIds);
    expect((screen.getByRole('combobox', { name: '行政區' }) as HTMLSelectElement).value).toBe('萬華區');
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('青山宮');
    expect(screen.queryByRole('button', { name: '返回場所介紹' })).toBeNull();
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('restores a source calendar month, filters and event selection after a related event temporarily selects its published date', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: qingshan.name });
    navigate('行事曆');
    await screen.findByRole('heading', { name: '宗教文化行事曆' });
    fireEvent.click(screen.getByRole('button', { name: '下個月' }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '青山' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(event.title.zh) }));
    const details = screen.getByRole('complementary', { name: event.title.zh });
    const opener = within(details).getByRole('button', { name: '探索信仰空間' });
    fireEvent.click(opener);
    const { related } = await profileDialog(qingshan);
    fireEvent.click(within(related).getByRole('button', { name: new RegExp(event.title.zh) }));
    await screen.findByRole('heading', { name: '2026年11月' });
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('');
    fireEvent.click(returnProfile());
    const returned = await screen.findByRole('dialog', { name: qingshan.name });
    fireEvent.keyDown(returned, { key: 'Escape' });
    expect(screen.getByRole('heading', { name: '2026年12月' })).toBeTruthy();
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('青山');
    expect(screen.getByRole('complementary', { name: event.title.zh })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it.each(['milestone', 'story'] as const)('returns from a related %s to the original Heritage chapter in the current language', async kind => {
    render(<App />);
    await screen.findByRole('heading', { name: lungshan.name });
    navigate('歷史與故事');
    await screen.findByRole('heading', { name: '宗教歷史時間軸' });
    fireEvent.click(screen.getByRole('button', { name: `閱讀故事: ${story.title.zh}` }));
    fireEvent.click(screen.getByRole('button', { name: '開始閱讀章節' }));
    const opener = screen.getByRole('button', { name: '開啟經查證場所介紹' });
    fireEvent.click(opener);
    const { related } = await profileDialog(lungshan);
    fireEvent.click(within(related).getByRole('button', { name: new RegExp(kind === 'milestone' ? milestone.title.zh : story.title.zh) }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    if (kind === 'milestone') expect((await screen.findByRole('button', { name: milestone.title.zh })).getAttribute('aria-pressed')).toBe('true');
    else expect(await screen.findByRole('heading', { name: '故事導讀' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    fireEvent.click(returnProfile());
    const returned = await screen.findByRole('dialog', { name: lungshan.name });
    expect(within(returned).getByRole('button', { name: 'About This Place' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(returned, { key: 'Escape' });
    expect(screen.getByRole('heading', { name: story.chapters[0].title.en })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Chapter 1 of 3');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open verified place profile' })));
    expect(map().getAttribute('data-focus-id')).toBe('');
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('visits a related route at the source organization and restores the original stop after further route reading', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: qingshan.name });
    navigate('散步路線');
    await screen.findByRole('heading', { name: '宗教文化散步路線' });
    fireEvent.click(screen.getByRole('button', { name: `選擇路線: ${route.title.zh}` }));
    fireEvent.click(screen.getByRole('button', { name: `Map stop: ${qingshan.name}` }));
    const opener = screen.getByRole('button', { name: '探索信仰空間' });
    fireEvent.click(opener);
    const { related } = await profileDialog(qingshan);
    fireEvent.click(within(related).getByRole('button', { name: new RegExp(route.title.zh) }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(map().getAttribute('data-selected-stop')).toBe(qingshan.id);
    fireEvent.click(screen.getByRole('button', { name: '下一站' }));
    expect(map().getAttribute('data-selected-stop')).toBe(route.stops[2].organizationId);
    fireEvent.click(screen.getByRole('button', { name: '退出路線' }));
    const returned = await screen.findByRole('dialog', { name: qingshan.name });
    fireEvent.keyDown(returned, { key: 'Escape' });
    expect(map().getAttribute('data-route-ids')).toBe(route.stops.map(stop => stop.organizationId).join(','));
    expect(map().getAttribute('data-selected-stop')).toBe(qingshan.id);
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('dismisses the one-hop return context when using primary navigation', async () => {
    render(<App />);
    const { related } = await openQingshanFromMap();
    fireEvent.click(within(related).getByRole('button', { name: new RegExp(event.title.zh) }));
    await screen.findByRole('complementary', { name: event.title.zh });
    navigate('地圖');
    expect(screen.queryByRole('button', { name: '返回場所介紹' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '探索信仰空間' }));
    const reopened = await profileDialog(qingshan);
    expect(within(reopened.related).getByRole('button', { name: new RegExp(event.title.zh) })).toBeTruthy();
  });

  it('preserves an existing return-to-Heritage excursion through a place profile related visit', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: lungshan.name });
    navigate('歷史與故事');
    await screen.findByRole('heading', { name: '宗教歷史時間軸' });
    fireEvent.click(screen.getByRole('button', { name: `閱讀故事: ${story.title.zh}` }));
    fireEvent.click(screen.getByRole('button', { name: '開始閱讀章節' }));
    const viewLocation = screen.getByRole('button', { name: '查看目前登記位置' });
    fireEvent.click(viewLocation);
    const listItem = screen.getByRole('heading', { name: lungshan.name }).closest('article')!;
    fireEvent.click(within(listItem).getByRole('button', { name: '探索信仰空間' }));
    const { related } = await profileDialog(lungshan);
    fireEvent.click(within(related).getByRole('button', { name: new RegExp(milestone.title.zh) }));
    await screen.findByRole('button', { name: milestone.title.zh });
    fireEvent.click(returnProfile());
    const returned = await screen.findByRole('dialog', { name: lungshan.name });
    fireEvent.keyDown(returned, { key: 'Escape' });
    expect(map().getAttribute('data-focus-id')).toBe(lungshan.id);
    expect(map().getAttribute('data-focus-temporary')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '返回歷史與故事' }));
    expect(screen.getByRole('heading', { name: story.chapters[0].title.zh })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: '查看目前登記位置' })));
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });
});
