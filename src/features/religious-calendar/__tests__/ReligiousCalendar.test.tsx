// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReligiousCalendar from '../ReligiousCalendar';
import { testEvent, testOrganization } from './calendarFixtures';

vi.mock('../culturalEvents', async () => ({ culturalEvents: [(await import('./calendarFixtures')).testEvent] }));

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-03T16:00:00Z')); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const props = { organizations: [testOrganization], language: 'en' as const, onViewMap: vi.fn(), onExplore: vi.fn() };

describe('religious cultural calendar', () => {
  it('opens in the Taipei current month, navigates across months and returns to today', () => {
    render(<ReligiousCalendar {...props} />);
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /November 4, 2026 · Today/ }).getAttribute('aria-current')).toBe('date');
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { name: 'January 2027' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Current month' }));
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeTruthy();
  });

  it('selects a verified notice, explains unknown participation, and links to the correct map and Faith Space', () => {
    const onViewMap = vi.fn();
    const onExplore = vi.fn();
    render(<ReligiousCalendar {...props} onViewMap={onViewMap} onExplore={onExplore} />);
    fireEvent.click(screen.getByRole('button', { name: /November 29, 2026/ }));
    const day = screen.getByRole('region', { name: 'Selected date' });
    fireEvent.click(within(day).getByRole('button', { name: /Sourced cultural event/ }));
    const details = screen.getByRole('complementary', { name: testEvent.title.en });
    expect(document.activeElement).toBe(details);
    expect(within(details).getByText('Participation details are unconfirmed. Please contact the organizer first.')).toBeTruthy();
    expect(within(details).getByText('Time not specified. Please check with the organizer.')).toBeTruthy();
    expect(within(details).getByRole('link', { name: /Official Information/ }).getAttribute('rel')).toBe('noopener noreferrer');
    fireEvent.click(within(details).getByRole('button', { name: 'View on Map' }));
    expect(onViewMap).toHaveBeenCalledExactlyOnceWith(testOrganization);
    fireEvent.click(within(details).getByRole('button', { name: 'Explore Faith Space' }));
    expect(onExplore).toHaveBeenCalledExactlyOnceWith(testOrganization);
    expect(document.activeElement).toBe(within(details).getByRole('button', { name: 'Explore Faith Space' }));
  });

  it('keeps lunar reference text out of the month while offering reference-to-place actions', () => {
    render(<ReligiousCalendar {...props} />);
    expect(screen.getAllByText('農曆10月22日')).toHaveLength(1);
    expect(screen.getByRole('table').textContent).not.toContain('農曆');
    fireEvent.click(screen.getByRole('button', { name: /Lunar date text.*行事曆測試宮/ }));
    const details = screen.getByRole('complementary', { name: testOrganization.name });
    expect(within(details).getByText('農曆10月22日')).toBeTruthy();
    expect(within(details).getByText('Festival date recorded in public data; not a confirmed event announcement for the current year.')).toBeTruthy();
    expect(within(details).getByRole('button', { name: 'Explore Faith Space' })).toBeTruthy();
  });

  it('filters religion, district and keyword and provides accurate empty states', () => {
    render(<ReligiousCalendar {...props} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Religion' }), { target: { value: '佛教' } });
    expect(screen.getByText('No upcoming confirmed events currently match these filters.')).toBeTruthy();
    expect(screen.getByText('No festival references match these filters.')).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox', { name: 'Religion' }), { target: { value: '' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'District' }), { target: { value: '萬華區' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '農曆' } });
    expect(screen.getByRole('button', { name: /Lunar date text.*行事曆測試宮/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Gregorian date text.*行事曆測試宮/ })).toBeNull();
  });

  it('offers a fully usable agenda and preserves selection, month and filters across languages', () => {
    const { rerender } = render(<ReligiousCalendar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: /Sourced cultural event/ })[0]);
    fireEvent.change(screen.getByRole('combobox', { name: 'District' }), { target: { value: '萬華區' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Sourced cultural event/ })[0]);
    rerender(<ReligiousCalendar {...props} language="zh" />);
    expect(screen.getByRole('heading', { name: '2026年11月' })).toBeTruthy();
    expect((screen.getByRole('combobox', { name: '行政區' }) as HTMLSelectElement).value).toBe('萬華區');
    expect(screen.getByRole('complementary', { name: testEvent.title.zh })).toBeTruthy();
    expect(screen.getByRole('button', { name: '活動清單' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('uses comfortable agenda controls on compact screens and preserves month and desktop view through resizing', () => {
    let compact = true;
    const listeners = new Set<() => void>();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ get matches() { return compact; }, addEventListener: (_name: string, listener: () => void) => listeners.add(listener), removeEventListener: (_name: string, listener: () => void) => listeners.delete(listener) })));
    const { unmount } = render(<ReligiousCalendar {...props} />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Month' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Agenda' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeTruthy();
    act(() => { compact = false; listeners.forEach(listener => listener()); });
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Month' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));
    act(() => { compact = true; listeners.forEach(listener => listener()); });
    act(() => { compact = false; listeners.forEach(listener => listener()); });
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('button', { name: 'Agenda' }).getAttribute('aria-pressed')).toBe('true');
    unmount();
    expect(listeners.size).toBe(0);
  });
});
