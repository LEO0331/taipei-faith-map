// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ReligiousOrganizationMap } from './ReligiousOrganizationMap';
import type { ReligiousOrganization } from '../types';

type FakeMarker = { html: string; bindPopup: (html: string) => FakeMarker; getPopup: () => { options: { autoPan: boolean }; getElement: () => Element | null }; openPopup: () => void };
type FakeCluster = { markers: FakeMarker[]; addLayer: (marker: FakeMarker) => void };
const state = vi.hoisted(() => ({ container: undefined as unknown as HTMLDivElement, removed: 0, opened: 0, restoredWithAutoPan: false, locationMarkers: 0, locationLabel: '', views: [] as number[][] }));
const map = vi.hoisted(() => ({
  getContainer: () => state.container,
  addLayer: (cluster: FakeCluster) => { state.container.innerHTML = cluster.markers.map(marker => marker.html).join(''); },
  removeLayer: () => { state.removed++; },
  setView: (coordinates: number[], zoom: number) => { state.views.push([...coordinates, zoom]); },
}));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  useMap: () => map,
}));
vi.mock('leaflet.markercluster', () => ({}));
vi.mock('leaflet', () => ({ default: {
  markerClusterGroup: () => { const markers: FakeMarker[] = []; return { markers, addLayer: (marker: FakeMarker) => { markers.push(marker); } }; },
  marker: () => {
    const popup = { options: { autoPan: true }, getElement: () => state.container.querySelector('article') };
    const marker: FakeMarker = {
      html: '', bindPopup(html) { marker.html = html; return marker; }, getPopup: () => popup,
      openPopup: () => { state.opened++; state.restoredWithAutoPan = popup.options.autoPan; },
    };
    return marker;
  },
  circleMarker: () => {
    state.locationMarkers++;
    return { addTo: () => undefined, removeFrom: () => undefined, bindPopup: (label: string) => { state.locationLabel = label; } };
  },
  divIcon: (options: unknown) => options,
} }));

const organization: ReligiousOrganization = {
  id: 'id" data-injected="yes', name: '<img src=x onerror=alert(1)>', religion: '道教', district: '大安區',
  address: '<script>untrusted</script>', festivalDates: [], originalX: 0, originalY: 0,
  latitude: 25.04, longitude: 121.53, source: 'Open data',
};

beforeEach(() => {
  state.container = document.createElement('div'); document.body.append(state.container);
  state.removed = 0; state.opened = 0; state.restoredWithAutoPan = false; state.locationMarkers = 0; state.locationLabel = ''; state.views = [];
});
afterEach(() => { cleanup(); state.container.remove(); });

describe('Leaflet exploration bridge', () => {
  it('escapes popup data and resolves the original organization through a scoped delegated click', () => {
    const onExplore = vi.fn();
    render(<ReligiousOrganizationMap items={[organization]} language="en" onExplore={onExplore} />);
    expect(state.container.querySelector('img, script')).toBeNull();
    expect(state.container.querySelector('h3')?.textContent).toBe(organization.name);
    const button = state.container.querySelector<HTMLButtonElement>('button[data-faith-organization]')!;
    expect(button.dataset.faithOrganization).toBe(organization.id);
    expect(button.hasAttribute('data-injected')).toBe(false);
    expect(button.textContent).toBe('Explore Faith Space');
    fireEvent.click(button);
    expect(onExplore).toHaveBeenCalledExactlyOnceWith(organization, expect.any(Function));
    const outsider = button.cloneNode(true) as HTMLButtonElement;
    document.body.append(outsider);
    fireEvent.click(outsider);
    expect(onExplore).toHaveBeenCalledTimes(1);
    outsider.remove();
  });

  it('removes old handlers on rerender and unmount, and ignores unknown IDs', () => {
    const previous = vi.fn();
    const next = vi.fn();
    const items = [organization];
    const { rerender, unmount } = render(<ReligiousOrganizationMap items={items} language="zh" onExplore={previous} />);
    rerender(<ReligiousOrganizationMap items={items} language="en" onExplore={next} />);
    const button = state.container.querySelector<HTMLButtonElement>('button[data-faith-organization]')!;
    fireEvent.click(button);
    expect(previous).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledExactlyOnceWith(organization, expect.any(Function));
    button.dataset.faithOrganization = 'unknown';
    fireEvent.click(button);
    expect(next).toHaveBeenCalledTimes(1);
    button.dataset.faithOrganization = organization.id;
    unmount();
    fireEvent.click(button);
    expect(next).toHaveBeenCalledTimes(1);
    expect(state.removed).toBe(2);
  });

  it('restores focus to the current translated popup without moving the map', () => {
    const onExplore = vi.fn();
    const items = [organization];
    const { rerender } = render(<ReligiousOrganizationMap items={items} language="zh" onExplore={onExplore} />);
    const original = state.container.querySelector<HTMLButtonElement>('button[data-faith-organization]')!;
    fireEvent.click(original);
    const restoreFocus = onExplore.mock.calls[0][1] as () => void;
    rerender(<ReligiousOrganizationMap items={items} language="en" onExplore={onExplore} />);
    expect(original.isConnected).toBe(false);
    restoreFocus();
    const current = state.container.querySelector<HTMLButtonElement>('button[data-faith-organization]')!;
    expect(document.activeElement).toBe(current);
    expect(current.textContent).toBe('Explore Faith Space');
    expect(state.opened).toBe(1);
    expect(state.restoredWithAutoPan).toBe(false);
    expect(state.views).toEqual([]);
  });

  it('updates user-location popup language without resetting the viewport or nearby location marker', () => {
    const onExplore = vi.fn();
    const items = [organization];
    const location = { latitude: 25.05, longitude: 121.54 };
    const { rerender } = render(<ReligiousOrganizationMap items={items} language="zh" userLocation={location} onExplore={onExplore} />);
    expect(state.views).toEqual([[25.05, 121.54, 15]]);
    expect(state.locationLabel).toBe('你的位置');
    rerender(<ReligiousOrganizationMap items={items} language="en" userLocation={{ ...location }} onExplore={onExplore} />);
    expect(state.locationMarkers).toBe(1);
    expect(state.locationLabel).toBe('Your location');
    expect(state.views).toEqual([[25.05, 121.54, 15]]);
    rerender(<ReligiousOrganizationMap items={items} language="en" userLocation={{ latitude: 25.06, longitude: 121.55 }} onExplore={onExplore} />);
    expect(state.locationMarkers).toBe(2);
    expect(state.views).toEqual([[25.05, 121.54, 15], [25.06, 121.55, 15]]);
  });
});
