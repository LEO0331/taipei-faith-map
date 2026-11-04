// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { ReligiousOrganizationMap } from '../../../components/ReligiousOrganizationMap';
import type { ReligiousOrganization } from '../../../types';

type Icon = { className: string; html: string | HTMLElement };
type Cluster = { markers: Marker[]; element?: HTMLElement; addLayer: (marker: Marker) => void };
type Marker = {
  html: string;
  bindPopup: (content: string | HTMLElement, options?: { autoPan?: boolean }) => Marker;
  getPopup: () => { options: { autoPan: boolean }; getElement: () => HTMLElement | null };
  openPopup: () => Marker;
  addTo: () => Marker;
  removeFrom: () => void;
  setIcon: (icon: Icon) => Marker;
  getElement: () => HTMLElement;
  setZIndexOffset: () => Marker;
  on: (event: string, listener: () => void) => Marker;
};

const state = vi.hoisted(() => ({
  container: undefined as unknown as HTMLElement,
  fits: [] as number[][][], views: [] as number[][], invalidations: 0,
}));
const map = vi.hoisted(() => ({
  getContainer: () => state.container,
  getCenter: () => ({ lat: 25.05, lng: 121.54 }), getZoom: () => 12,
  invalidateSize: () => { state.invalidations++; },
  fitBounds: (coordinates: number[][]) => { state.fits.push(coordinates); },
  setView: (coordinates: number[] | { lat: number; lng: number }, zoom: number) => {
    state.views.push([...(Array.isArray(coordinates) ? coordinates : [coordinates.lat, coordinates.lng]), zoom]);
  },
  addLayer: (cluster: Cluster) => {
    cluster.element = document.createElement('div');
    cluster.element.className = 'mock-cluster';
    cluster.element.innerHTML = cluster.markers.map(marker => marker.html).join('');
    state.container.append(cluster.element);
  },
  removeLayer: (cluster: Cluster) => cluster.element?.remove(),
}));

vi.mock('react-leaflet', () => ({ MapContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>, TileLayer: () => null, useMap: () => map }));
vi.mock('leaflet.markercluster', () => ({}));
vi.mock('leaflet', () => ({ default: {
  markerClusterGroup: () => { const markers: Marker[] = []; return { markers, addLayer: (marker: Marker) => markers.push(marker) }; },
  divIcon: (icon: Icon) => icon,
  marker: (_: unknown, options: { icon: Icon; title?: string }) => {
    const element = document.createElement('div');
    element.tabIndex = 0;
    if (options.title) element.title = options.title;
    let popupElement: HTMLElement | null = null;
    const popup = { options: { autoPan: true }, getElement: () => popupElement };
    const marker: Marker = {
      html: '',
      bindPopup(content, popupOptions) {
        marker.html = typeof content === 'string' ? content : content.outerHTML;
        popupElement?.remove();
        popupElement = document.createElement('div');
        popupElement.className = 'mock-focused-popup';
        if (typeof content === 'string') popupElement.innerHTML = content;
        else popupElement.append(content);
        popup.options.autoPan = popupOptions?.autoPan ?? true;
        return marker;
      },
      getPopup: () => popup,
      openPopup() { if (popupElement) state.container.append(popupElement); return marker; },
      addTo() { state.container.append(element); return marker; },
      removeFrom() { element.remove(); popupElement?.remove(); },
      setIcon(icon) {
        element.className = icon.className;
        if (typeof icon.html === 'string') element.innerHTML = icon.html;
        else element.replaceChildren(icon.html);
        return marker;
      },
      getElement: () => element,
      setZIndexOffset: () => marker,
      on(event, listener) { element.addEventListener(event, listener); return marker; },
    };
    marker.setIcon(options.icon);
    return marker;
  },
} }));

const first: ReligiousOrganization = {
  id: 'first', name: '第一站', religion: '道教', district: '萬華區', address: '測試路1號',
  latitude: 25.04, longitude: 121.5, originalX: 0, originalY: 0, festivalDates: [], source: 'Open data',
};
const second = { ...first, id: 'second', name: '第二站', longitude: 121.51 };

beforeEach(() => {
  state.container = document.createElement('div'); document.body.append(state.container);
  state.fits = []; state.views = []; state.invalidations = 0;
});
afterEach(() => { cleanup(); state.container.remove(); });

describe('shared map route and calendar layers', () => {
  it('keeps numbered stop selection in sync without refitting on a language or stop change', () => {
    const onSelect = vi.fn(); const stops = [first, second]; const onExplore = vi.fn();
    const { rerender } = render(<ReligiousOrganizationMap items={stops} language="en" onExplore={onExplore} routeStops={stops} selectedRouteStopId={first.id} onRouteStopSelect={onSelect} />);
    const markers = [...state.container.querySelectorAll('.cultural-route-marker')];
    expect(markers.map(marker => marker.textContent)).toEqual(['1', '2']);
    expect(markers[0].getAttribute('aria-label')).toBe('Stop 1 of 2: 第一站');
    expect(markers[0].getAttribute('aria-pressed')).toBe('true');
    expect(state.container.querySelector('.mock-cluster')).toBeNull();
    fireEvent.click(markers[1]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(second.id);
    rerender(<ReligiousOrganizationMap items={stops} language="zh" onExplore={onExplore} routeStops={stops} selectedRouteStopId={second.id} onRouteStopSelect={onSelect} />);
    expect(state.fits).toEqual([[[25.04, 121.5], [25.04, 121.51]]]);
    expect(state.views).toEqual([]);
    expect(state.container.querySelectorAll('.cultural-route-marker')[1]).toBe(markers[1]);
    expect(markers[1].getAttribute('aria-label')).toBe('第 2／2 站：第二站');
    expect(markers[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('restores the regular viewport after switching routes and leaving route mode', () => {
    const stops = [first, second]; const onExplore = vi.fn();
    const { rerender } = render(<ReligiousOrganizationMap items={stops} language="en" onExplore={onExplore} routeStops={stops} />);
    rerender(<ReligiousOrganizationMap items={stops} language="en" onExplore={onExplore} routeStops={[first, { ...second, latitude: 25.06 }]} />);
    expect(state.fits).toHaveLength(2);
    rerender(<ReligiousOrganizationMap items={stops} language="en" onExplore={onExplore} />);
    expect(state.views).toEqual([[25.05, 121.54, 12]]);
    expect(state.container.querySelectorAll('.cultural-route-marker')).toHaveLength(0);
    expect(state.container.querySelector('.mock-cluster')).toBeTruthy();
  });

  it('focuses an organization excluded by filters and restores its translated popup control', () => {
    const onExplore = vi.fn();
    const excluded = { ...first, id: 'outside" data-injected="yes', name: '<img src=x onerror=alert(1)>' };
    const request = { organization: excluded, token: 1 };
    const { rerender, unmount } = render(<ReligiousOrganizationMap items={[second]} language="zh" onExplore={onExplore} focusRequest={request} />);
    const popup = state.container.querySelector('.mock-focused-popup')!;
    expect(popup.querySelector('img')).toBeNull();
    expect(popup.querySelector('h3')?.textContent).toBe(excluded.name);
    const button = popup.querySelector<HTMLButtonElement>('button')!;
    expect(button.dataset.faithOrganization).toBe(excluded.id);
    fireEvent.click(button);
    expect(onExplore).toHaveBeenCalledExactlyOnceWith(excluded, expect.any(Function));
    const restore = onExplore.mock.calls[0][1] as () => void;
    rerender(<ReligiousOrganizationMap items={[second]} language="en" onExplore={onExplore} focusRequest={request} />);
    restore();
    expect(document.activeElement?.textContent).toBe('Explore Faith Space');
    expect(state.views).toEqual([[25.04, 121.5, 15]]);
    rerender(<ReligiousOrganizationMap items={[second]} language="en" onExplore={onExplore} focusRequest={{ ...request, token: 2 }} />);
    expect(state.views).toHaveLength(2);
    unmount();
    expect(state.container.querySelector('.mock-focused-popup')).toBeNull();
  });

  it('rejects invalid coordinates and resizes a newly visible map without moving its viewport', async () => {
    const onExplore = vi.fn(); const invalid = { ...second, latitude: Number.NaN };
    const { rerender } = render(<ReligiousOrganizationMap items={[]} language="en" onExplore={onExplore} routeStops={[first, invalid]} focusRequest={{ organization: invalid, token: 1 }} visible={false} />);
    expect(state.fits).toHaveLength(0);
    expect(state.views).toHaveLength(0);
    expect(state.container.querySelectorAll('.cultural-route-marker')).toHaveLength(0);
    expect(state.invalidations).toBe(0);
    rerender(<ReligiousOrganizationMap items={[]} language="en" onExplore={onExplore} visible />);
    await waitFor(() => expect(state.invalidations).toBe(1));
    expect(state.views).toHaveLength(0);
  });

  it('does not reapply an old calendar focus request when returning from route mode', () => {
    const onExplore = vi.fn(); const stops = [first, second];
    const request = { organization: first, token: 1 };
    const { rerender } = render(<ReligiousOrganizationMap items={stops} language="en" onExplore={onExplore} focusRequest={request} />);
    expect(state.views).toEqual([[25.04, 121.5, 15]]);
    rerender(<ReligiousOrganizationMap items={stops} language="en" onExplore={onExplore} focusRequest={request} routeStops={stops} />);
    rerender(<ReligiousOrganizationMap items={stops} language="en" onExplore={onExplore} focusRequest={request} />);
    expect(state.views).toEqual([[25.04, 121.5, 15], [25.05, 121.54, 12]]);
  });
});
