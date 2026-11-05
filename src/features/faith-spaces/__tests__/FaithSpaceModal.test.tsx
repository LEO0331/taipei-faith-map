// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import FaithSpaceModal from '../FaithSpaceModal';
import { getFaithSpaceConfig } from '../faithSpaceConfig';
import type { ReligiousOrganization } from '../../../types';

const organization: ReligiousOrganization = {
  id: 'test-faith', name: '文化測試宮', religion: '道教', district: '大安區', village: '龍門里',
  address: '臺北市測試路1號', festivalDates: [], originalX: 0, originalY: 0,
  latitude: 25.04, longitude: 121.53, source: 'Open data',
};

afterEach(() => cleanup());

describe('Faith Space dialog', () => {
  it('names the selected location, discloses illustrative content and exposes working hotspots', () => {
    render(<FaithSpaceModal organization={organization} language="zh" onClose={vi.fn()} onLanguageChange={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: organization.name });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(within(dialog).getByText(organization.address)).toBeTruthy();
    expect(within(dialog).getByText('此為宗教文化示意場景，非該場所的實際建築或室內配置。')).toBeTruthy();
    const lantern = getFaithSpaceConfig('道教').hotspots[1];
    fireEvent.click(within(dialog).getByRole('button', { name: lantern.title.zh }));
    expect(within(dialog).getByRole('button', { name: lantern.title.zh }).getAttribute('aria-pressed')).toBe('true');
    expect(within(dialog).getByText(lantern.body.zh)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: '收合說明' }));
    expect(within(dialog).getByRole('button', { name: '展開說明' }).getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(within(dialog).getByRole('button', { name: lantern.title.zh }));
    expect(within(dialog).getByRole('button', { name: '收合說明' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('updates language without losing the selected organization or hotspot', () => {
    const onLanguageChange = vi.fn();
    const props = { organization, onClose: vi.fn(), onLanguageChange };
    const { rerender } = render(<FaithSpaceModal {...props} language="zh" />);
    const lantern = getFaithSpaceConfig('道教').hotspots[1];
    fireEvent.click(screen.getByRole('button', { name: lantern.title.zh }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onLanguageChange).toHaveBeenCalledWith('en');
    rerender(<FaithSpaceModal {...props} language="en" />);
    expect(screen.getByRole('dialog', { name: organization.name })).toBeTruthy();
    expect(screen.getByRole('button', { name: lantern.title.en }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(lantern.body.en)).toBeTruthy();
    expect(screen.getByText('This is an illustrative cultural scene, not a reconstruction of this specific location.')).toBeTruthy();
  });

  it('focuses the close control, contains focus, closes with Escape and restores scroll styles', () => {
    document.body.style.overflow = 'scroll';
    const outside = document.createElement('button');
    document.body.append(outside);
    const onClose = vi.fn();
    const { unmount } = render(<FaithSpaceModal organization={organization} language="en" onClose={onClose} onLanguageChange={vi.fn()} />);
    const close = screen.getByRole('button', { name: 'Close Faith Space' });
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe('hidden');
    const controls = screen.getByRole('dialog').querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    const last = controls[controls.length - 1];
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    outside.focus();
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
    outside.remove();
    document.body.style.overflow = '';
  });

  it('wraps focus around visible controls and skips closed disclosures, CSS-hidden controls and negative tab stops', () => {
    render(<FaithSpaceModal organization={organization} language="en" onClose={vi.fn()} onLanguageChange={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const disclosure = document.createElement('details');
    disclosure.innerHTML = '<summary>Additional information</summary><a href="https://example.org">Collapsed source</a>';
    dialog.append(disclosure);
    const hidden = document.createElement('button');
    hidden.style.display = 'none';
    hidden.textContent = 'Hidden control';
    dialog.append(hidden);
    const programmatic = document.createElement('button');
    programmatic.tabIndex = -1;
    programmatic.textContent = 'Programmatic control';
    dialog.append(programmatic);
    const close = screen.getByRole('button', { name: 'Close Faith Space' });
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(disclosure.querySelector('summary'));
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    disclosure.open = true;
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(disclosure.querySelector('a'));
  });
});
