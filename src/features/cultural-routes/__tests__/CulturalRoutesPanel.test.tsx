// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import organizationsJson from '../../../../public/data/religious-organizations.json';
import type { Language, ReligiousOrganization } from '../../../types';
import CulturalRoutesPanel from '../CulturalRoutesPanel';
import { culturalRoutes } from '../culturalRoutes';
import type { ResolvedCulturalRoute } from '../routeTypes';

const organizations = organizationsJson as ReligiousOrganization[];
const route = culturalRoutes[0];
afterEach(cleanup);

function Harness({ initialLanguage = 'en', onExplore = vi.fn(), onExit = vi.fn() }: { initialLanguage?: Language; onExplore?: (organization: ReligiousOrganization) => void; onExit?: () => void }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [selectedRoute, setSelectedRoute] = useState<ResolvedCulturalRoute>();
  const [selectedStopId, setSelectedStopId] = useState<string>();
  return <>
    <button onClick={() => setLanguage(current => current === 'en' ? 'zh' : 'en')}>Change language</button>
    <CulturalRoutesPanel organizations={organizations} language={language} selectedRoute={selectedRoute} selectedStopId={selectedStopId}
      onSelectRoute={selected => { setSelectedRoute(selected); setSelectedStopId(selected?.organizations[0].id); }}
      onSelectStop={setSelectedStopId} onExplore={onExplore} onExit={onExit} />
  </>;
}

describe('walking route browsing and stop selection', () => {
  it('offers reviewed routes, selects their first stop, and displays real evidence and walking navigation', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Cultural Walking Routes' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: `Choose route: ${route.title.en}` }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: route.title.en }));
    const stop = screen.getByRole('region', { name: route.stops[0].title.en });
    expect(within(stop).getByText(route.stops[0].description.en)).toBeTruthy();
    expect(within(stop).getAllByRole('link').length).toBeGreaterThan(0);
    expect((screen.getByRole('button', { name: 'Previous stop' }) as HTMLButtonElement).disabled).toBe(true);
    const directions = screen.getByRole('link', { name: /Open Walking Directions.*Google Maps/ });
    expect(new URL(directions.getAttribute('href')!).searchParams.get('travelmode')).toBe('walking');
    expect(directions.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.queryByText(/walking distance|walking time|minutes|kilometers/i)).toBeNull();
  });

  it('keeps previous/next and ordered stop buttons synchronized, and explores the current organization', () => {
    const onExplore = vi.fn();
    render(<Harness onExplore={onExplore} />);
    fireEvent.click(screen.getByRole('button', { name: `Choose route: ${route.title.en}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Next stop' }));
    const second = screen.getByRole('button', { name: new RegExp(`${route.stops[1].title.en}.*2 of ${route.stops.length} stops`) });
    expect(second.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(second);
    fireEvent.click(screen.getByRole('button', { name: 'Explore Faith Space' }));
    expect(onExplore).toHaveBeenCalledExactlyOnceWith(organizations.find(organization => organization.id === route.stops[1].organizationId));
    const last = screen.getByRole('button', { name: new RegExp(`${route.stops[route.stops.length - 1].title.en}.*${route.stops.length} of ${route.stops.length} stops`) });
    fireEvent.click(last);
    expect(last.getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByRole('button', { name: 'Next stop' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Previous stop' }));
    expect(second.getAttribute('aria-pressed')).toBe('true');
  });

  it('preserves the selected route and stop while changing language, with overview and exit controls', () => {
    const onExit = vi.fn();
    render(<Harness onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: `Choose route: ${route.title.en}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Next stop' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    expect(screen.getByRole('heading', { name: route.title.zh })).toBeTruthy();
    const selected = screen.getByRole('button', { name: new RegExp(`${route.stops[1].title.zh}.*第 2／${route.stops.length} 站`) });
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('region', { name: route.stops[1].title.zh })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '退出路線' }));
    expect(onExit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /返回路線總覽/ }));
    expect(screen.getByRole('button', { name: `選擇路線: ${route.title.zh}` })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: '宗教文化散步路線' }));
  });

  it('provides an accurate empty state when records cannot be uniquely verified', () => {
    const onSelectRoute = vi.fn();
    render(<CulturalRoutesPanel organizations={[]} language="en" onSelectRoute={onSelectRoute} onSelectStop={vi.fn()} onExplore={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByText('No available, reviewed cultural routes are currently listed.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Choose route/ })).toBeNull();
  });
});
