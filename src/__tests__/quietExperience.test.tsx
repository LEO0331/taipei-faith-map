// @vitest-environment jsdom
import axe from 'axe-core';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '../types';
import QuietGardenDialog from '../features/quiet-presence/QuietGardenDialog';
import { QuietGardenStatus } from '../features/quiet-presence/QuietGardenLoader';
import { QuietVerificationRequiredError } from '../services/supabaseClient';

const mocks = vi.hoisted(() => ({ join: vi.fn(), read: vi.fn(), submit: vi.fn(), report: vi.fn(), challenge: vi.fn() }));
vi.mock('../features/quiet-presence/presenceClient', () => ({ joinQuietGarden: mocks.join }));
vi.mock('../features/quiet-corner/quietCornerClient', () => ({ readApprovedNotes: mocks.read, submitQuietNote: mocks.submit, reportQuietNote: mocks.report }));
vi.mock('../components/GuestChallenge', () => ({ GuestChallenge: ({ action, onToken }: { action: string; onToken: (token: string) => void }) => {
  mocks.challenge(action);
  return <button type="button" onClick={() => onToken('verified-proof')}>Verify {action}</button>;
} }));

const note = { id: '11111111-1111-4111-8111-111111111111', content: 'A quiet good wish.', expiresAt: '2050-01-01T00:00:00Z' };
const connection = { guestKey: '11111111-1111-4111-8111-111111111111', leave: vi.fn(async () => undefined), perform: vi.fn(async () => true) };
const copy = {
  en: { board: 'Open Quiet Corner', write: 'Write a short note', cancel: 'Cancel', report: /^Report this note/, enter: 'Enter Quiet Garden', leave: 'Leave shared garden' },
  zh: { board: '開啟留言角落', write: '寫下一句話', cancel: '取消', report: /^回報這則留言/, enter: '進入靜心庭院', leave: '離開共享庭院' },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_QUIET_PRESENCE_ENABLED', 'true');
  vi.stubEnv('VITE_QUIET_CORNER_ENABLED', 'true');
  mocks.join.mockResolvedValue(connection);
  mocks.read.mockResolvedValue([note]);
  localStorage.clear();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); });

async function structuralAudit(container: HTMLElement) {
  // JSDOM cannot verify rendered contrast, viewport fit or screen-reader behavior.
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
}

describe('low-friction shared experience', () => {
  it('bounds opening feedback and keeps a focused keyboard return available', () => {
    vi.useFakeTimers();
    const close = vi.fn();
    render(<QuietGardenStatus language="en" onClose={close} />);
    const control = screen.getByRole('button', { name: 'Return to exploration' });
    expect(document.activeElement).toBe(control);
    expect(screen.getByRole('status').textContent).toBe('Opening Quiet Garden…');
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole('status').textContent).toBe('Shared presence is temporarily unavailable. Solo exploration remains available.');
    fireEvent.keyDown(control, { key: 'Tab' });
    expect(document.activeElement).toBe(control);
    fireEvent.keyDown(control, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
    expect(mocks.join).not.toHaveBeenCalled();
  });
  it.each(['en', 'zh'] as Language[])('keeps %s passive reading free of guest registration, connection and CAPTCHA', async language => {
    const { container } = render(<QuietGardenDialog language={language} onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    expect(mocks.join).not.toHaveBeenCalled();
    expect(mocks.challenge).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: copy[language].board }));
    await screen.findByText(note.content);
    expect(mocks.read).toHaveBeenCalledOnce();
    expect(mocks.join).not.toHaveBeenCalled();
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(mocks.report).not.toHaveBeenCalled();
    expect(mocks.challenge).not.toHaveBeenCalled();
  });

  it('asks for verification after explicit join only and never invents remote peers', async () => {
    mocks.join.mockRejectedValueOnce(new QuietVerificationRequiredError());
    const { container } = render(<QuietGardenDialog language="en" onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    expect(mocks.challenge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: copy.en.enter }));
    fireEvent.click(await screen.findByRole('button', { name: 'Verify quiet-garden' }));
    fireEvent.click(screen.getByRole('button', { name: copy.en.enter }));
    await screen.findByRole('button', { name: copy.en.leave });
    expect(mocks.join.mock.calls[1][0].captchaToken).toBe('verified-proof');
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(1);
    expect(screen.getByText('No other visitors are connected here right now.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: copy.en.leave }));
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(0);
    expect(connection.leave).toHaveBeenCalledOnce();
  });

  it.each(['en', 'zh'] as Language[])('audits %s dialog, reading, composer and report semantics', async language => {
    document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
    const { container } = render(<QuietGardenDialog language={language} onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    await structuralAudit(container);
    fireEvent.click(screen.getByRole('button', { name: copy[language].board }));
    await screen.findByText(note.content);
    await structuralAudit(container);
    fireEvent.click(screen.getByRole('button', { name: copy[language].write }));
    expect(screen.getByRole('textbox')).toBe(document.activeElement);
    expect(screen.getByRole('button', { name: 'Verify quiet-note' })).toBeTruthy();
    await structuralAudit(container);
    fireEvent.click(screen.getByRole('button', { name: copy[language].cancel }));
    fireEvent.click(screen.getByRole('button', { name: copy[language].report }));
    expect(screen.getByRole('combobox')).toBe(document.activeElement);
    expect(screen.getByRole('button', { name: 'Verify quiet-report' })).toBeTruthy();
    await structuralAudit(container);
    expect(mocks.join).not.toHaveBeenCalled();
  });
});
