// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FaithSpaceModal from '../FaithSpaceModal';
import { getFaithSpaceConfig } from '../faithSpaceConfig';
import { placeProfiles } from '../placeProfiles';
import type { ReligionType, ReligiousOrganization } from '../../../types';

const organization: ReligiousOrganization = {
  id: 'tour-test-place', name: '文化導覽測試場所', religion: '道教', district: '松山區',
  address: '測試路1號', festivalDates: [], source: 'Government dataset',
  originalX: 0, originalY: 0, latitude: 25, longitude: 121,
};
const props = { organization, language: 'en' as const, onClose: vi.fn(), onLanguageChange: vi.fn() };
const taoist = getFaithSpaceConfig('道教');
const button = (name: string) => screen.getByRole('button', { name });
const click = (name: string) => fireEvent.click(button(name));
const detail = () => screen.getByRole('region', { name: screen.getByRole('button', { name: 'Collapse information' }).closest('.faith-detail')?.querySelector('h2')?.textContent ?? '' });

afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

describe('guided cultural discovery', () => {
  it.each<ReligionType>(['道教', '佛教', '基督教', '天主教', '回教', '未分類'])('starts at the first configured detail for %s and preserves existing hotspot coordinates', religion => {
    const config = getFaithSpaceConfig(religion);
    render(<FaithSpaceModal {...props} organization={{ ...organization, religion }} />);
    expect(button('Free Exploration').getAttribute('aria-pressed')).toBe('true');
    click(config.hotspots[config.hotspots.length - 1].title.en);
    click('Guided Tour');
    const active = button(config.hotspots[0].title.en);
    expect(active.getAttribute('aria-pressed')).toBe('true');
    expect(active.style.left).toBe(`${config.hotspots[0].x}%`);
    expect(active.style.top).toBe(`${config.hotspots[0].y}%`);
    expect((button('Previous') as HTMLButtonElement).disabled).toBe(true);
    expect(detail().textContent).toContain(`1 of ${config.hotspots.length} cultural details`);
    expect(within(detail()).getByText(config.hotspots[0].body.en)).toBeTruthy();
    const panelId = active.getAttribute('aria-controls');
    const bodyId = active.getAttribute('aria-describedby');
    expect(document.getElementById(panelId ?? '')).toBe(detail());
    expect(document.getElementById(bodyId ?? '')?.textContent).toBe(config.hotspots[0].body.en);
    expect(detail().getAttribute('aria-live')).toBe('polite');
    expect(detail().getAttribute('aria-atomic')).toBe('true');
    expect(detail().querySelectorAll('[aria-live]')).toHaveLength(0);
    expect(document.querySelectorAll('.faith-detail[aria-live="polite"]')).toHaveLength(1);
    expect(document.querySelector('.faith-illustration')).toBeTruthy();
  });

  it('navigates backward and forward, completes neutrally and restarts from the beginning', () => {
    render(<FaithSpaceModal {...props} />);
    click('Guided Tour');
    click('Next');
    expect(button(taoist.hotspots[1].title.en).getAttribute('aria-pressed')).toBe('true');
    expect(detail().textContent).toContain('2 of 3 cultural details');
    button('Previous').focus();
    click('Previous');
    expect(document.activeElement).toBe(button('Next'));
    expect(button(taoist.hotspots[0].title.en).getAttribute('aria-pressed')).toBe('true');
    click('Next');
    click('Next');
    expect(within(detail()).getByText(taoist.hotspots[2].body.en)).toBeTruthy();
    click('Finish tour');
    expect(within(detail()).getByText("You've explored this space.")).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Finish tour' })).toBeNull();
    click('Restart tour');
    expect(button(taoist.hotspots[0].title.en).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByText("You've explored this space.")).toBeNull();
    expect((button('Previous') as HTMLButtonElement).disabled).toBe(true);
  });

  it('exits into free exploration without losing the selected detail and allows starting again', () => {
    render(<FaithSpaceModal {...props} />);
    click('Guided Tour');
    expect(document.activeElement).toBe(button('Next'));
    click('Next');
    click('Exit tour');
    expect(document.activeElement).toBe(button('Free Exploration'));
    expect(button('Free Exploration').getAttribute('aria-pressed')).toBe('true');
    expect(button(taoist.hotspots[1].title.en).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('navigation', { name: 'Guided Tour' })).toBeNull();
    click('Guided Tour');
    expect(button(taoist.hotspots[0].title.en).getAttribute('aria-pressed')).toBe('true');
    click('Next');
    click('Free Exploration');
    expect(button(taoist.hotspots[1].title.en).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Exit tour' })).toBeNull();
  });

  it('allows choosing any hotspot to leave the sequence and explore that detail', () => {
    render(<FaithSpaceModal {...props} />);
    click('Guided Tour');
    click(taoist.hotspots[2].title.en);
    expect(button('Free Exploration').getAttribute('aria-pressed')).toBe('true');
    expect(button(taoist.hotspots[2].title.en).getAttribute('aria-pressed')).toBe('true');
    expect(within(detail()).getByText(taoist.hotspots[2].body.en)).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Guided Tour' })).toBeNull();
  });

  it('preserves the current tour step when changing languages', () => {
    const onLanguageChange = vi.fn();
    const { rerender } = render(<FaithSpaceModal {...props} onLanguageChange={onLanguageChange} />);
    click('Guided Tour');
    click('Next');
    click('中文');
    expect(onLanguageChange).toHaveBeenCalledWith('zh');
    rerender(<FaithSpaceModal {...props} language="zh" onLanguageChange={onLanguageChange} />);
    expect(button(taoist.hotspots[1].title.zh).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('region', { name: taoist.hotspots[1].title.zh }).textContent).toContain('第 2／3 個文化細節');
    expect(screen.getByText(taoist.hotspots[1].body.zh)).toBeTruthy();
    click('下一個');
    expect(button(taoist.hotspots[2].title.zh).getAttribute('aria-pressed')).toBe('true');
    expect(button('完成導覽')).toBeTruthy();
  });

  it('keeps the scene, tour step and running reflection timer when visiting the place profile panel', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T00:00:00Z'));
    render(<FaithSpaceModal {...props} />);
    click('Start');
    act(() => vi.advanceTimersByTime(10_000));
    const originalCountdown = screen.getByLabelText('Time remaining');
    expect(originalCountdown.textContent).toBe('00:50');
    click('Guided Tour');
    click('Next');
    click('About This Place');
    expect(screen.getByText('No verified cultural profile is currently available for this location. You can still explore the general cultural scene.')).toBeTruthy();
    expect(document.querySelector('.faith-illustration')).toBeTruthy();
    expect(button(taoist.hotspots[1].title.en).getAttribute('aria-pressed')).toBe('true');
    act(() => vi.advanceTimersByTime(5_000));
    click('Cultural Scene');
    expect(screen.getByLabelText('Time remaining')).toBe(originalCountdown);
    expect(screen.getByLabelText('Time remaining').textContent).toBe('00:45');
    expect(button('Pause')).toBeTruthy();
    expect(detail().textContent).toContain('2 of 3 cultural details');
    expect(button('Guided Tour').getAttribute('aria-pressed')).toBe('true');
  });

  it('contains keyboard focus around visible profile links and never includes hidden timer controls', () => {
    const profile = placeProfiles[0];
    render(<FaithSpaceModal {...props} organization={{ ...organization, id: profile.organizationId, name: profile.organizationName, district: profile.district, address: profile.address }} />);
    click('About This Place');
    const links = screen.getAllByRole('link');
    const last = links[links.length - 1];
    const close = button('Close Faith Space');
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Public Open Data · Registration' })).toBeTruthy();
    expect(screen.getByText('This is an illustrative cultural scene, not a reconstruction of this specific location.')).toBeTruthy();
  });
});
