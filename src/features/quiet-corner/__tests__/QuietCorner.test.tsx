// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuietCorner from '../QuietCorner';
import { QuietCornerError } from '../quietCornerTypes';

const mocks = vi.hoisted(() => ({ flags: vi.fn(), read: vi.fn(), submit: vi.fn(), report: vi.fn() }));
vi.mock('../../../utils/featureFlags', () => ({ getFeatureFlags: mocks.flags }));
vi.mock('../quietCornerClient', () => ({ readApprovedNotes: mocks.read, submitQuietNote: mocks.submit, reportQuietNote: mocks.report }));
const note = { id: '11111111-1111-4111-8111-111111111111', content: '<img src=x onerror=alert(1)> https://example.org', expiresAt: '2050-01-01T00:00:00Z' };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.flags.mockReturnValue({ quietCorner: true });
  mocks.read.mockResolvedValue([]); mocks.submit.mockResolvedValue(undefined); mocks.report.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Quiet Corner', () => {
  it('requests the matching CAPTCHA action only when composing or reporting', async () => {
    mocks.read.mockResolvedValue([note]);
    const challenge = vi.fn((action: 'quiet-note' | 'quiet-report') => <span>{action} verification</span>);
    render(<QuietCorner language="en" onClose={vi.fn()} challenge={challenge} />);
    await screen.findByText(note.content);
    expect(challenge).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Write a short note' }));
    expect(screen.getByText('quiet-note verification')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: /Report this note/ }));
    expect(screen.getByText('quiet-report verification')).toBeTruthy();
    expect(screen.queryByText('quiet-note verification')).toBeNull();
  });
  it('reads without requiring a submission and renders approved messages as escaped, unlinked text', async () => {
    mocks.read.mockResolvedValue([note]);
    const { container, rerender } = render(<QuietCorner language="en" onClose={vi.fn()} />);
    await screen.findByText(note.content);
    expect(container.querySelector('img,script,a')).toBeNull();
    expect(screen.getByRole('list', { name: 'Approved notes' }).querySelectorAll('[role="listitem"]')).toHaveLength(1);
    expect(mocks.submit).not.toHaveBeenCalled(); expect(mocks.report).not.toHaveBeenCalled();
    rerender(<QuietCorner language="zh" onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { name: '留言角落' })).toBeTruthy();
    expect(screen.getByText(note.content)).toBeTruthy();
  });

  it('has a truthful empty state and never initializes the board when disabled', async () => {
    const { rerender } = render(<QuietCorner language="en" onClose={vi.fn()} />);
    await screen.findByText('There are no approved notes to read right now.');
    expect(screen.queryByRole('list')).toBeNull();
    mocks.read.mockClear(); mocks.flags.mockReturnValue({ quietCorner: false });
    rerender(<QuietCorner language="en" onClose={vi.fn()} />);
    expect(screen.getByText('Quiet Corner is currently disabled. Solo exploration remains available.')).toBeTruthy();
    expect(mocks.read).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Write a short note' })).toBeNull();
  });

  it('requires an explicit valid submission and never adds the submitted note to the public board', async () => {
    const reset = vi.fn();
    const { container } = render(<QuietCorner language="en" onClose={vi.fn()} challenge={<span>Verification challenge</span>} captchaToken="fresh-token" onResetCaptcha={reset} />);
    await screen.findByText('There are no approved notes to read right now.');
    fireEvent.click(screen.getByRole('button', { name: 'Write a short note' }));
    const input = screen.getByRole('textbox', { name: 'A short thought or good wish' });
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole('button', { name: 'Submit for review' }).hasAttribute('disabled')).toBe(true);
    fireEvent.change(input, { target: { value: 'A private good wish.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await screen.findByText('Your note was received and will appear only after review.');
    expect(mocks.submit).toHaveBeenCalledWith('A private good wish.', 'fresh-token', expect.any(AbortSignal));
    expect(container.querySelectorAll('.quiet-note')).toHaveLength(0);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(reset).toHaveBeenCalledOnce();
  });

  it('keeps the draft while requesting a new CAPTCHA after anonymous Auth consumes the first token', async () => {
    mocks.submit.mockRejectedValueOnce(new QuietCornerError('fresh-verification'));
    const reset = vi.fn();
    const props = { language: 'en' as const, onClose: vi.fn(), challenge: <span>Verification challenge</span>, onResetCaptcha: reset };
    const { rerender } = render(<QuietCorner {...props} captchaToken="auth-token" />);
    fireEvent.click(screen.getByRole('button', { name: 'Write a short note' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'A calm moment.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await screen.findByText('Please complete fresh verification before sending.');
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('A calm moment.');
    expect(screen.queryByText('Your note was received and will appear only after review.')).toBeNull();
    rerender(<QuietCorner {...props} captchaToken={undefined} />);
    expect(screen.getByRole('button', { name: 'Submit for review' }).hasAttribute('disabled')).toBe(true);
    rerender(<QuietCorner {...props} captchaToken="new-edge-token" />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await screen.findByText('Your note was received and will appear only after review.');
    expect(mocks.submit.mock.calls[1][1]).toBe('new-edge-token');
  });

  it('enforces the text limit, reports with a bounded reason, and has no free-text report chat', async () => {
    mocks.read.mockResolvedValue([note]);
    render(<QuietCorner language="en" onClose={vi.fn()} captchaToken="report-token" />);
    await screen.findByText(note.content);
    fireEvent.click(screen.getByRole('button', { name: 'Write a short note' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '祝'.repeat(81) } });
    expect(screen.getByRole('textbox').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('button', { name: 'Submit for review' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp('^Report this note') }));
    expect(screen.queryByRole('textbox')).toBeNull();
    const reason = screen.getByRole('combobox', { name: 'Reason' });
    expect(document.activeElement).toBe(reason);
    fireEvent.change(reason, { target: { value: 'personal-data' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    await screen.findByText('Your report was received for operator review.');
    expect(mocks.report).toHaveBeenCalledWith(note.id, 'personal-data', 'report-token', expect.any(AbortSignal));
  });

  it('falls back without exposing backend error details and aborts work on unmount', async () => {
    mocks.read.mockRejectedValueOnce(new Error('Private backend detail'));
    const close = vi.fn();
    const { unmount } = render(<QuietCorner language="zh" onClose={close} />);
    await screen.findByText('留言角落目前無法使用，仍可自由探索。');
    expect(screen.queryByText('Private backend detail')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '關閉留言角落' }));
    expect(close).toHaveBeenCalledOnce();
    const readSignal = mocks.read.mock.calls[0][0] as AbortSignal;
    unmount();
    expect(readSignal.aborted).toBe(true);
  });

  it('removes a displayed note when its expiry is reached and clears expiry timers', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-05T00:00:00Z'));
    mocks.read.mockResolvedValue([{ ...note, expiresAt: '2026-11-05T00:00:01Z' }]);
    const { unmount } = render(<QuietCorner language="en" onClose={vi.fn()} />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(note.content)).toBeTruthy();
    act(() => vi.advanceTimersByTime(1001));
    expect(screen.queryByText(note.content)).toBeNull();
    expect(screen.getByText('There are no approved notes to read right now.')).toBeTruthy();
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});
