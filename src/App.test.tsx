// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Language, ReligiousOrganization } from './types';
import { App } from './App';

const lifecycle = vi.hoisted(() => ({ mounted: 0, unmounted: 0 }));
vi.mock('./components/ReligiousOrganizationMap', async () => {
  const React = await import('react');
  return {
    ReligiousOrganizationMap: ({ items, language, userLocation, onExplore }: { items: ReligiousOrganization[]; language: Language; userLocation?: { latitude: number; longitude: number }; onExplore: (item: ReligiousOrganization, restoreFocus?: () => void) => void }) => {
      React.useEffect(() => { lifecycle.mounted++; return () => { lifecycle.unmounted++; }; }, []);
      const trigger = React.useRef<HTMLButtonElement>(null);
      return <div data-testid="persistent-map" data-location={userLocation ? JSON.stringify(userLocation) : ''}><button key={language} ref={trigger} onClick={() => onExplore(items[0], () => trigger.current?.focus())}>Explore map marker</button></div>;
    },
  };
});

const organization: ReligiousOrganization = {
  id: 'map-org', name: '保留地圖宮', religion: '道教', district: '大安區', village: '龍門里',
  address: '測試路1號', festivalDates: ['測試日期'], originalX: 0, originalY: 0,
  latitude: 25.04, longitude: 121.53, source: 'Open data',
};

beforeEach(() => {
  localStorage.clear();
  lifecycle.mounted = 0;
  lifecycle.unmounted = 0;
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [organization, { ...organization, id: 'second', name: '另一處', district: '信義區', religion: '佛教', festivalDates: [] }] }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('optional garden entry', () => {
  it('keeps the entry absent with default flags', async () => {
    vi.stubEnv('VITE_QUIET_PRESENCE_ENABLED', 'false');
    render(<App />);
    await screen.findByRole('heading', { name: organization.name });
    expect(screen.queryByRole('button', { name: '靜心庭院' })).toBeNull();
  });

  it.each(['presence', 'corner'])('preserves exploration and restores focus with the %s flag independently enabled', async feature => {
    vi.stubEnv('VITE_QUIET_PRESENCE_ENABLED', feature === 'presence' ? 'true' : 'false');
    vi.stubEnv('VITE_QUIET_CORNER_ENABLED', feature === 'corner' ? 'true' : 'false');
    const { container } = render(<App />);
    await screen.findByRole('heading', { name: organization.name });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: organization.name } });
    const map = screen.getByTestId('persistent-map');
    const opener = screen.getByRole('button', { name: '靜心庭院' });
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: '靜心庭院' });
    expect(container.querySelector('.app')?.hasAttribute('inert')).toBe(true);
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(screen.getByTestId('persistent-map')).toBe(map);
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe(organization.name);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });
});

describe('first-minute exploration', () => {
  it('opens an existing filtered result directly and returns to the welcome action', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: organization.name });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '另一處' } });
    const opener = screen.getByRole('button', { name: '探索一處信仰空間' });
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: '另一處' });
    expect(within(dialog).getByText(organization.address)).toBeTruthy();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('另一處');
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no matching place' } });
    expect(opener.hasAttribute('disabled')).toBe(true);
  });

  it('welcomes visitors in both languages without a tutorial or social request', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: organization.name });
    expect(screen.getByRole('region', { name: '從這裡開始' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByText('Explore slowly. Notice deeply.')).toBeTruthy();
    const mapLink = screen.getByRole('link', { name: 'Browse the map' });
    expect(mapLink.getAttribute('href')).toBe('#faith-main-map');
    fireEvent.click(mapLink);
    expect(document.activeElement?.id).toBe('faith-main-map');
    expect(vi.mocked(fetch).mock.calls.every(([url]) => String(url).includes('data/religious-organizations.json'))).toBe(true);
  });
});

describe('Faith Spaces map integration', () => {
  it('opens from the list, restores invoking focus, and retains mounted map and filters', async () => {
    const { container } = render(<App />);
    await screen.findByRole('heading', { name: organization.name });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: organization.name } });
    fireEvent.change(screen.getByLabelText('行政區'), { target: { value: '大安區' } });
    fireEvent.click(screen.getByRole('checkbox', { name: '有祭典日期' }));
    const map = screen.getByTestId('persistent-map');
    const opener = screen.getByRole('button', { name: '探索信仰空間' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: organization.name });
    expect(container.querySelector('.app')?.hasAttribute('inert')).toBe(true);
    expect(within(dialog).getByText(organization.address)).toBeTruthy();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(screen.getByTestId('persistent-map')).toBe(map);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe(organization.name);
    expect((screen.getByLabelText('行政區') as HTMLSelectElement).value).toBe('大安區');
    expect((screen.getByRole('checkbox', { name: '有祭典日期' }) as HTMLInputElement).checked).toBe(true);
    expect(container.querySelectorAll('.record-item')).toHaveLength(1);
    expect(container.querySelector('.app')?.hasAttribute('inert')).toBe(false);
  });

  it('opens the shared scene from the map callback and changes language while open', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: organization.name });
    const opener = screen.getByRole('button', { name: 'Explore map marker' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: organization.name });
    fireEvent.click(within(dialog).getByRole('button', { name: 'English' }));
    expect(within(dialog).getByText('This is an illustrative cultural scene, not a reconstruction of this specific location.')).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
    expect(opener.isConnected).toBe(false);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close Faith Space' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Explore map marker' })));
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });

  it('retains nearby location, radius and results after exploring and changing language', async () => {
    const location = { latitude: organization.latitude, longitude: organization.longitude };
    const getCurrentPosition = vi.fn((success: PositionCallback) => success({ coords: location } as GeolocationPosition));
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    const { container } = render(<App />);
    await screen.findByRole('heading', { name: organization.name });
    fireEvent.change(screen.getByLabelText('附近範圍'), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: '顯示附近宗教團體' }));
    const nearby = container.querySelector('.nearby-panel')!;
    expect(within(nearby as HTMLElement).getByRole('heading', { name: '附近宗教團體' })).toBeTruthy();
    expect(within(nearby as HTMLElement).getByText(organization.name)).toBeTruthy();
    expect(nearby.querySelectorAll('li')).toHaveLength(2);
    const map = screen.getByTestId('persistent-map');
    expect(map.getAttribute('data-location')).toBe(JSON.stringify(location));
    fireEvent.click(screen.getAllByRole('button', { name: '探索信仰空間' })[0]);
    const dialog = await screen.findByRole('dialog', { name: organization.name });
    fireEvent.click(within(dialog).getByRole('button', { name: 'English' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close Faith Space' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((screen.getByLabelText('Nearby radius') as HTMLSelectElement).value).toBe('2000');
    expect(within(nearby as HTMLElement).getByRole('heading', { name: 'Nearby religious organizations' })).toBeTruthy();
    expect(within(nearby as HTMLElement).getByText(organization.name)).toBeTruthy();
    expect(nearby.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByTestId('persistent-map')).toBe(map);
    expect(map.getAttribute('data-location')).toBe(JSON.stringify(location));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(lifecycle).toEqual({ mounted: 1, unmounted: 0 });
  });
});
