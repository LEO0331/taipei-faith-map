// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReligiousOrganization } from './types';
import { App } from './App';
import governmentData from '../public/data/religious-organizations.json';
import { culturalRoutes } from './features/cultural-routes/culturalRoutes';
import { culturalEvents } from './features/religious-calendar/culturalEvents';

const lifecycle = vi.hoisted(() => ({ mounted: 0, unmounted: 0 }));
type MapProps = {
  items: ReligiousOrganization[];
  routeStops?: ReligiousOrganization[];
  selectedRouteStopId?: string;
  onRouteStopSelect?: (id: string) => void;
  focusRequest?: { organization: ReligiousOrganization; token: number };
  visible?: boolean;
};
vi.mock('./components/ReligiousOrganizationMap', async () => {
  const React = await import('react');
  return {
    ReligiousOrganizationMap: ({ items, routeStops, selectedRouteStopId, onRouteStopSelect, focusRequest, visible }: MapProps) => {
      React.useEffect(() => { lifecycle.mounted++; return () => { lifecycle.unmounted++; }; }, []);
      return <div data-testid="discovery-map" data-visible={String(visible)}
        data-filtered-ids={items.map(item => item.id).join(',')} data-focus-id={focusRequest?.organization.id ?? ''}
        data-focus-token={focusRequest?.token ?? ''} data-selected-stop={selectedRouteStopId ?? ''}
        data-route-ids={routeStops?.map(stop => stop.id).join(',') ?? ''}>
        {routeStops?.map(stop => <button key={stop.id} onClick={() => onRouteStopSelect?.(stop.id)}>Map stop: {stop.name}</button>)}
      </div>;
    },
  };
});

const identities = new Set([...culturalRoutes.flatMap(route => route.stops.map(stop => stop.organizationId)), ...culturalEvents.map(event => event.organizationId)]);
const organizations = (governmentData as ReligiousOrganization[]).filter(organization => identities.has(organization.id));
const bangka = culturalRoutes.find(route => route.id === 'wanhua-temple-heritage')!;
const dadaocheng = culturalRoutes.find(route => route.id === 'dadaocheng-faith-and-community')!;
const qingshanEvent = culturalEvents[0];
const qingshan = organizations.find(organization => organization.id === qingshanEvent.organizationId)!;

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

const nav = () => screen.getByRole('navigation', { name: /探索台北信仰文化|Explore Taipei faith and culture/ });
const navigate = (name: string) => fireEvent.click(within(nav()).getByRole('button', { name }));
const map = () => screen.getByTestId('discovery-map');

describe('Calendar and cultural route integration', () => {
  it('opens the selected calendar organization and highlights events and festival references outside the preserved map filters', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: qingshan.name });
    fireEvent.change(screen.getByLabelText('行政區'), { target: { value: '大同區' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '霞海' } });
    const originalMap = map();
    const filteredIds = originalMap.getAttribute('data-filtered-ids');
    expect(filteredIds?.includes(qingshan.id)).toBe(false);
    navigate('行事曆');
    await screen.findByRole('heading', { name: '宗教文化行事曆' });
    expect(map().getAttribute('data-visible')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(qingshanEvent.title.zh) }));
    const details = screen.getByRole('complementary', { name: qingshanEvent.title.zh });
    expect(within(details).getByRole('heading', { name: qingshanEvent.title.zh })).toBeTruthy();
    const explore = within(details).getByRole('button', { name: '探索信仰空間' });
    fireEvent.click(explore);
    const dialog = await screen.findByRole('dialog', { name: qingshan.name });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(explore));
    expect(within(nav()).getByRole('button', { name: '行事曆' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(within(details).getByRole('button', { name: '地圖查看' }));
    expect(map()).toBe(originalMap);
    expect(map().getAttribute('data-focus-id')).toBe(qingshan.id);
    expect(map().getAttribute('data-focus-token')).toBe('1');
    expect(map().getAttribute('data-filtered-ids')).toBe(filteredIds);
    expect((screen.getByRole('combobox', { name: '行政區' }) as HTMLSelectElement).value).toBe('大同區');
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('霞海');
    navigate('行事曆');
    const references = screen.getByRole('region', { name: '宗教節慶參考' });
    fireEvent.click(within(references).getByRole('button', { name: new RegExp(qingshan.name) }));
    expect(within(details).getByRole('heading', { name: qingshan.name })).toBeTruthy();
    expect(within(details).getByText(qingshan.festivalDates[0])).toBeTruthy();
    fireEvent.click(within(details).getByRole('button', { name: '地圖查看' }));
    expect(map().getAttribute('data-focus-id')).toBe(qingshan.id);
    expect(map().getAttribute('data-focus-token')).toBe('2');
    expect(map().getAttribute('data-filtered-ids')).toBe(filteredIds);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('retains calendar month, view and filters while navigating between all three modes', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: qingshan.name });
    const originalMap = map();
    navigate('行事曆');
    await screen.findByRole('heading', { name: '宗教文化行事曆' });
    fireEvent.click(screen.getByRole('button', { name: '下個月' }));
    fireEvent.click(screen.getByRole('button', { name: '活動清單' }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '青山' } });
    expect(screen.getByRole('heading', { name: '2026年12月' })).toBeTruthy();
    navigate('散步路線');
    await screen.findByRole('heading', { name: '宗教文化散步路線' });
    expect(map().getAttribute('data-visible')).toBe('true');
    navigate('地圖');
    expect(screen.getByRole('searchbox').getAttribute('value')).toBe('');
    navigate('行事曆');
    expect(screen.getByRole('heading', { name: '2026年12月' })).toBeTruthy();
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('青山');
    expect(screen.getByRole('button', { name: '活動清單' }).getAttribute('aria-pressed')).toBe('true');
    expect(map()).toBe(originalMap);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('shares route selection between map and stop list and keeps route and original map filters across Faith Spaces and language changes', async () => {
    const { container } = render(<App />);
    await screen.findByRole('heading', { name: qingshan.name });
    fireEvent.change(screen.getByLabelText('行政區'), { target: { value: '大同區' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '霞海' } });
    const originalMap = map();
    const filteredIds = originalMap.getAttribute('data-filtered-ids');
    navigate('散步路線');
    await screen.findByRole('heading', { name: '宗教文化散步路線' });
    fireEvent.click(screen.getByRole('button', { name: `選擇路線: ${bangka.title.zh}` }));
    const first = bangka.stops[0];
    const second = bangka.stops[1];
    const third = bangka.stops[2];
    expect(map().getAttribute('data-route-ids')).toBe(bangka.stops.map(stop => stop.organizationId).join(','));
    expect(map().getAttribute('data-selected-stop')).toBe(first.organizationId);
    expect(map().getAttribute('data-filtered-ids')).toBe(filteredIds);
    fireEvent.click(screen.getByRole('button', { name: `Map stop: ${second.organizationName}` }));
    expect(screen.getByRole('button', { name: new RegExp(second.title.zh) }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('region', { name: second.title.zh })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '閱讀此站文化介紹' }));
    expect(document.activeElement).toBe(screen.getByRole('region', { name: second.title.zh }));
    fireEvent.click(screen.getByRole('button', { name: '下一站' }));
    expect(map().getAttribute('data-selected-stop')).toBe(third.organizationId);
    expect(screen.getByRole('button', { name: '下一站' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '上一站' }));
    expect(map().getAttribute('data-selected-stop')).toBe(second.organizationId);
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByRole('region', { name: second.title.en })).toBeTruthy();
    expect(map().getAttribute('data-selected-stop')).toBe(second.organizationId);
    const explore = screen.getByRole('button', { name: 'Explore Faith Space' });
    fireEvent.click(explore);
    const dialog = await screen.findByRole('dialog', { name: second.organizationName });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close Faith Space' }));
    await waitFor(() => expect(document.activeElement).toBe(explore));
    expect(screen.getByRole('region', { name: second.title.en })).toBeTruthy();
    expect(map().getAttribute('data-selected-stop')).toBe(second.organizationId);
    expect(map()).toBe(originalMap);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
    fireEvent.click(screen.getByRole('button', { name: 'Exit route' }));
    expect(within(nav()).getByRole('button', { name: 'Map' }).getAttribute('aria-current')).toBe('page');
    expect(map().getAttribute('data-route-ids')).toBe('');
    expect(map().getAttribute('data-filtered-ids')).toBe(filteredIds);
    expect((screen.getByLabelText('District') as HTMLSelectElement).value).toBe('大同區');
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('霞海');
    expect(container.querySelectorAll('.record-item')).toHaveLength(1);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Religious organizations map' })));
    navigate('Walking Routes');
    expect(screen.getByRole('button', { name: `Choose route: ${dadaocheng.title.en}` })).toBeTruthy();
    expect(map()).toBe(originalMap);
  });
});
