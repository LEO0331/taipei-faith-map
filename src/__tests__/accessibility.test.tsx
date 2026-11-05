// @vitest-environment jsdom
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import governmentData from '../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../types';
import FaithSpaceModal from '../features/faith-spaces/FaithSpaceModal';
import ReligiousCalendar from '../features/religious-calendar/ReligiousCalendar';
import CulturalRoutesPanel from '../features/cultural-routes/CulturalRoutesPanel';
import { getAvailableRoutes } from '../features/cultural-routes/routeLookup';
import HeritageExplorer from '../features/heritage/HeritageExplorer';
import { heritageStories } from '../features/heritage/heritageStories';

const organizations = governmentData as ReligiousOrganization[];
const organization = organizations[0];
const noAction = () => undefined;

// JSDOM has no layout or rendered colours. These structural checks deliberately
// exclude contrast; browser, screen-reader and real-device testing remain separate.
async function expectAccessible(container: HTMLElement) {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
}

beforeEach(() => {
  document.documentElement.lang = 'en';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-05T04:00:00Z'));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('structural accessibility audits', () => {
  it('audits the Faith Space free, guided and verified-profile states', async () => {
    const { container, rerender } = render(<FaithSpaceModal organization={organization} language="en" onClose={noAction} onLanguageChange={noAction} />);
    await expectAccessible(container);
    fireEvent.click(screen.getByRole('button', { name: 'Guided Tour' }));
    await expectAccessible(container);
    fireEvent.click(screen.getByRole('button', { name: 'About This Place' }));
    await expectAccessible(container);
    rerender(<FaithSpaceModal organization={organization} language="zh" onClose={noAction} onLanguageChange={noAction} />);
    expect(screen.getByRole('group', { name: '語言' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '中文' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('false');
    await expectAccessible(container);
  });

  it('audits a lazy related-content panel inside the verified place dialog', async () => {
    const subject = organizations.find(item => item.id === 'org-21-1bs6r0m')!;
    const { container } = render(<FaithSpaceModal organization={subject} organizations={organizations} language="en" initialPanel="place" onNavigateRelated={noAction} onClose={noAction} onLanguageChange={noAction} />);
    await screen.findByRole('region', { name: 'Related Cultural Content' });
    await expectAccessible(container);
  });

  it('audits sourced tradition introductions in the neutral Faith Space', async () => {
    const unclassified = organizations.find(item => item.religion === '一貫道')!;
    const { container } = render(<FaithSpaceModal organization={unclassified} language="en" onClose={noAction} onLanguageChange={noAction} />);
    await expectAccessible(container);
  });

  it('audits the calendar agenda and its selected event details', async () => {
    const { container } = render(<main><h1>Calendar accessibility review</h1><ReligiousCalendar organizations={organizations} language="en" onViewMap={noAction} onExplore={noAction} /></main>);
    fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));
    await expectAccessible(container);
    const events = screen.queryAllByRole('button', { name: /Qingshan Temple Night Patrol/ });
    expect(events.length).toBeGreaterThan(0);
    fireEvent.click(events[0]);
    await expectAccessible(container);
  });

  it('audits the selected cultural route and keyboard stop controls', async () => {
    const route = getAvailableRoutes(organizations)[0];
    const { container } = render(<main><h1>Walking route accessibility review</h1><CulturalRoutesPanel organizations={organizations} language="en" selectedRoute={route} selectedStopId={route.organizations[0].id} onSelectRoute={noAction} onSelectStop={noAction} onExplore={noAction} onExit={noAction} /></main>);
    await expectAccessible(container);
  });

  it('audits heritage timeline and a story chapter without replacing historical date precision', async () => {
    const { container } = render(<main><h1>Heritage accessibility review</h1><HeritageExplorer organizations={organizations} language="en" onViewMap={noAction} onExplore={noAction} onOpenProfile={noAction} onOpenRoute={noAction} /></main>);
    await expectAccessible(container);
    const milestone = container.querySelector<HTMLButtonElement>('.heritage-timeline button')!;
    const dateDescription = document.getElementById(milestone.getAttribute('aria-describedby')!);
    expect(dateDescription?.textContent).toContain('Year only');
    expect(dateDescription?.textContent).toContain('1738');
    fireEvent.click(screen.getByRole('button', { name: `Read story: ${heritageStories[0].title.en}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Start chapters' }));
    await expectAccessible(container);
  });
});
