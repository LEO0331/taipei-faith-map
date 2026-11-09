// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { MapFocusRequest } from './components/ReligiousOrganizationMap';
import type { ReligiousOrganization } from './types';
import { App } from './App';
import governmentData from '../public/data/religious-organizations.json';
import { culturalRoutes } from './features/cultural-routes/culturalRoutes';
import { heritageOrganizations } from './features/heritage/heritageOrganizations';
import { heritageStories } from './features/heritage/heritageStories';
import { historicalMilestones } from './features/heritage/historicalMilestones';

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
      return <div data-testid="heritage-map" data-visible={String(visible)}
        data-filtered-ids={items.map(item => item.id).join(',')}
        data-focused-ids={focusRequest ? [focusRequest.organization, ...(focusRequest.relatedOrganizations ?? [])].map(item => item.id).join(',') : ''}
        data-focus-token={focusRequest?.token ?? ''} data-temporary-focus={String(!!focusRequest?.temporary)}
        data-selected-stop={selectedRouteStopId ?? ''} data-route-ids={routeStops?.map(stop => stop.id).join(',') ?? ''}>
        {routeStops?.map(stop => <button key={stop.id} onClick={() => onRouteStopSelect?.(stop.id)}>Map stop: {stop.name}</button>)}
      </div>;
    },
  };
});

const ids = new Set([...heritageOrganizations.map(place => place.organizationId), ...culturalRoutes.flatMap(route => route.stops.map(stop => stop.organizationId))]);
const organizations = (governmentData as ReligiousOrganization[]).filter(organization => ids.has(organization.id));
const story = heritageStories.find(item => item.id === 'bangka-building-layers')!;
const founding = historicalMilestones.find(item => item.id === 'lungshan-foundation-1738')!;
const lungshan = organizations.find(item => item.id === founding.organizationIds[0])!;
const originalRoute = culturalRoutes.find(item => item.id === 'dadaocheng-faith-and-community')!;
const linkedRoute = culturalRoutes.find(item => item.id === story.routeIds![0])!;

beforeEach(() => {
  localStorage.clear();
  lifecycle.mounted = 0;
  lifecycle.unmounted = 0;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-04T04:00:00Z'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => organizations }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const navigation = () => screen.getByRole('navigation', { name: /探索台北信仰文化|Explore Taipei faith and culture/ });
const navigate = (name: string) => fireEvent.click(within(navigation()).getByRole('button', { name }));
const map = () => screen.getByTestId('heritage-map');
const activeHeritage = () => screen.getByRole('region', { name: /^(宗教歷史時間軸|臺北信仰文化故事|Historical Timeline|Heritage Stories)$/ });
async function enterHeritage() {
  navigate('歷史與故事');
  await screen.findByRole('heading', { name: '宗教歷史時間軸' });
}
function openBangkaStory() {
  fireEvent.click(within(activeHeritage()).getByRole('button', { name: `閱讀故事: ${story.title.zh}` }));
  fireEvent.click(screen.getByRole('button', { name: '開始閱讀章節' }));
}

describe('Heritage discovery integration', () => {
  it('returns from route-linked history to the same stop and invoking control after a language change', async () => {
    const { container } = render(<App />);
    await screen.findByRole('heading', { name: lungshan.name });
    navigate('散步路線');
    fireEvent.click(await screen.findByRole('button', { name: `選擇路線: ${linkedRoute.title.zh}` }));
    fireEvent.click(screen.getByRole('button', { name: '下一站' }));
    const stopId = map().getAttribute('data-selected-stop');
    const opener = await waitFor(() => {
      const button = container.querySelector<HTMLButtonElement>(`[data-route-history="${linkedRoute.id}"]`);
      expect(button).not.toBeNull();
      return button!;
    });
    opener.focus();
    fireEvent.click(opener);
    await screen.findByRole('heading', { name: story.title.zh });
    fireEvent.click(screen.getByRole('button', { name: '開始閱讀章節' }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('heading', { name: story.chapters[0].title.en })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View current registered location' }));
    fireEvent.click(screen.getByRole('button', { name: 'Return to History & Stories' }));
    expect(screen.getByRole('heading', { name: story.chapters[0].title.en })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Return to the walking route' }));
    expect(map().getAttribute('data-selected-stop')).toBe(stopId);
    expect(screen.getByRole('heading', { name: linkedRoute.title.en })).toBeTruthy();
    await waitFor(() => expect(container.querySelector(`[data-route-history="${linkedRoute.id}"]`)).toBe(document.activeElement));
  });

  it('browses history without moving the map, requests current-location highlights explicitly and restores timeline focus and filters', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: lungshan.name });
    fireEvent.change(screen.getByRole('combobox', { name: '行政區' }), { target: { value: '大同區' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '霞海' } });
    const originalMap = map();
    const filteredIds = originalMap.getAttribute('data-filtered-ids');
    await enterHeritage();
    expect(map().getAttribute('data-focused-ids')).toBe('');
    expect(map().getAttribute('data-visible')).toBe('false');
    fireEvent.change(screen.getByRole('combobox', { name: '歷史主題' }), { target: { value: 'foundation' } });
    fireEvent.click(screen.getByRole('button', { name: founding.title.zh }));
    expect(map().getAttribute('data-focused-ids')).toBe('');
    const viewPlace = screen.getByRole('button', { name: '查看目前登記位置' });
    fireEvent.click(viewPlace);
    expect(within(navigation()).getByRole('button', { name: '地圖' }).getAttribute('aria-current')).toBe('page');
    expect(map().getAttribute('data-focused-ids')).toBe(lungshan.id);
    expect(map().getAttribute('data-temporary-focus')).toBe('true');
    expect(map().getAttribute('data-filtered-ids')).toBe(filteredIds);
    expect(screen.getAllByText('目前登記位置，並非經查證的歷史座標。').length).toBeGreaterThan(0);
    expect((screen.getByRole('combobox', { name: '行政區' }) as HTMLSelectElement).value).toBe('大同區');
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('霞海');
    fireEvent.click(screen.getAllByRole('button', { name: '返回歷史與故事' })[0]);
    await waitFor(() => expect(document.activeElement).toBe(viewPlace));
    expect(screen.getByRole('button', { name: founding.title.zh }).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByRole('combobox', { name: '歷史主題' }) as HTMLSelectElement).value).toBe('foundation');
    expect(map().getAttribute('data-focused-ids')).toBe('');
    expect(map()).toBe(originalMap);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('opens the correct verified place profile from a chapter and preserves chapter and language on return', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: lungshan.name });
    const originalMap = map();
    await enterHeritage();
    openBangkaStory();
    expect(screen.getByRole('heading', { name: story.chapters[0].title.zh })).toBeTruthy();
    const profile = screen.getByRole('button', { name: '開啟經查證場所介紹' });
    fireEvent.click(profile);
    const dialog = await screen.findByRole('dialog', { name: lungshan.name });
    expect(within(dialog).getByRole('button', { name: '認識這個場所' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(dialog).getByText('有來源支持的場所介紹')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'English' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close Faith Space' }));
    await waitFor(() => expect(document.activeElement).toBe(profile));
    expect(screen.getByRole('heading', { name: story.chapters[0].title.en })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Chapter 1 of 3');
    expect(within(navigation()).getByRole('button', { name: 'History & Stories' }).getAttribute('aria-current')).toBe('page');
    expect(map().getAttribute('data-focused-ids')).toBe('');
    expect(map()).toBe(originalMap);
    const currentLocation = screen.getByRole('button', { name: 'View current registered location' });
    fireEvent.click(currentLocation);
    expect(map().getAttribute('data-focused-ids')).toBe(lungshan.id);
    fireEvent.click(screen.getAllByRole('button', { name: 'Return to History & Stories' })[0]);
    await waitFor(() => expect(document.activeElement).toBe(currentLocation));
    expect(screen.getByRole('heading', { name: story.chapters[0].title.en })).toBeTruthy();
  });

  it.each(['退出路線', '返回歷史與故事'])('restores the previous route and stop after a story-linked route using %s', async returnAction => {
    render(<App />);
    await screen.findByRole('heading', { name: lungshan.name });
    const originalMap = map();
    navigate('散步路線');
    await screen.findByRole('heading', { name: '宗教文化散步路線' });
    fireEvent.click(screen.getByRole('button', { name: `選擇路線: ${originalRoute.title.zh}` }));
    fireEvent.click(screen.getByRole('button', { name: '下一站' }));
    const previousStop = originalRoute.stops[1].organizationId;
    expect(map().getAttribute('data-selected-stop')).toBe(previousStop);
    await enterHeritage();
    openBangkaStory();
    for (let index = 1; index < story.chapters.length; index++) fireEvent.click(screen.getByRole('button', { name: '下一章' }));
    fireEvent.click(screen.getByRole('button', { name: '閱讀結語' }));
    const link = screen.getByRole('button', { name: `探索相關文化散步路線: ${linkedRoute.title.zh}` });
    fireEvent.click(link);
    await waitFor(() => expect(map().getAttribute('data-route-ids')).toBe(linkedRoute.stops.map(stop => stop.organizationId).join(',')));
    expect(screen.getByRole('heading', { name: linkedRoute.title.zh })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: returnAction }));
    await waitFor(() => expect(document.activeElement).toBe(link));
    expect(screen.getByRole('heading', { name: '故事結語' })).toBeTruthy();
    navigate('散步路線');
    expect(screen.getByRole('heading', { name: originalRoute.title.zh })).toBeTruthy();
    expect(map().getAttribute('data-route-ids')).toBe(originalRoute.stops.map(stop => stop.organizationId).join(','));
    expect(map().getAttribute('data-selected-stop')).toBe(previousStop);
    expect(map()).toBe(originalMap);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('keeps calendar month and agenda independent of history navigation and location excursions', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: lungshan.name });
    navigate('行事曆');
    await screen.findByRole('heading', { name: '宗教文化行事曆' });
    fireEvent.click(screen.getByRole('button', { name: '下個月' }));
    fireEvent.click(screen.getByRole('button', { name: '活動清單' }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '青山' } });
    await enterHeritage();
    fireEvent.click(screen.getByRole('button', { name: '查看目前登記位置' }));
    fireEvent.click(screen.getAllByRole('button', { name: '返回歷史與故事' })[0]);
    navigate('行事曆');
    expect(screen.getByRole('heading', { name: '2026年12月' })).toBeTruthy();
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('青山');
    expect(screen.getByRole('button', { name: '活動清單' }).getAttribute('aria-pressed')).toBe('true');
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });
});
