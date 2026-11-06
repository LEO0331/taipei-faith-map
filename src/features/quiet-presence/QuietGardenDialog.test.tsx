// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuietGardenDialog from './QuietGardenDialog';
import { getFeatureFlags } from '../../utils/featureFlags';
import { useVisitorMotion } from '../faith-moments/useVisitorMotion';

vi.mock('../../utils/featureFlags', () => ({ getFeatureFlags: vi.fn() }));
vi.mock('../faith-moments/useVisitorMotion', () => ({ useVisitorMotion: vi.fn() }));
vi.mock('./QuietGarden', () => ({ default: ({ enabled, captchaToken, challenge, notesSlot, onCaptchaConsumed }: { enabled: boolean; captchaToken?: string; challenge?: React.ReactNode; notesSlot?: React.ReactNode; onCaptchaConsumed?: () => void }) => <section data-testid="garden" data-enabled={String(enabled)} data-token={captchaToken}><button onClick={onCaptchaConsumed}>Consume verification</button>{challenge}{notesSlot}</section> }));
vi.mock('../quiet-corner/QuietCorner', () => ({ default: ({ onClose }: { onClose: () => void }) => <section aria-label="Notes"><button onClick={onClose}>Close notes</button></section> }));
vi.mock('../../components/GuestChallenge', () => ({ GuestChallenge: ({ onToken, resetKey }: { onToken: (value: string) => void; resetKey: number }) => <button data-reset={resetKey} onClick={() => onToken('proof')}>Mock verification</button> }));
const setMotionEnabled = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFeatureFlags).mockReturnValue({ faithMoments: true, quietPresence: true, quietCorner: false });
  vi.mocked(useVisitorMotion).mockReturnValue({ motionEnabled: true, setMotionEnabled } as unknown as ReturnType<typeof useVisitorMotion>);
});
afterEach(() => { cleanup(); document.body.style.overflow = ''; });

describe('quiet garden dialog shell', () => {
  it('offers the board independently while Presence is disabled', () => {
    vi.mocked(getFeatureFlags).mockReturnValue({ faithMoments: true, quietPresence: false, quietCorner: true });
    render(<QuietGardenDialog language="en" onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('region', { name: 'Notes' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open Quiet Corner' }));
    expect(screen.getByRole('region', { name: 'Notes' })).toBeTruthy();
    expect(screen.getByTestId('garden').getAttribute('data-enabled')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Close notes' }));
    expect(screen.queryByRole('region', { name: 'Notes' })).toBeNull();
  });
  it('focuses close, contains keyboard focus and restores body scrolling on unmount', () => {
    document.body.style.overflow = 'scroll';
    const onClose = vi.fn();
    const outside = document.createElement('button'); document.body.append(outside);
    const { unmount } = render(<QuietGardenDialog language="en" onLanguageChange={vi.fn()} onClose={onClose} />);
    const close = screen.getByRole('button', { name: 'Return to exploration' });
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe('hidden');
    outside.focus(); expect(document.activeElement).toBe(close);
    const last = screen.getByRole('button', { name: 'Mock verification' });
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(last, { key: 'Tab' }); expect(document.activeElement).toBe(close);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount(); expect(document.body.style.overflow).toBe('scroll');
    outside.focus(); expect(document.activeElement).toBe(outside); outside.remove();
  });

  it('passes the disabled presence flag and preserves language and motion controls', () => {
    vi.mocked(getFeatureFlags).mockReturnValue({ faithMoments: true, quietPresence: false, quietCorner: false });
    const onLanguageChange = vi.fn();
    render(<QuietGardenDialog language="en" onLanguageChange={onLanguageChange} onClose={vi.fn()} />);
    expect(screen.getByTestId('garden').getAttribute('data-enabled')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: '中文' }));
    expect(onLanguageChange).toHaveBeenCalledWith('zh');
    fireEvent.click(screen.getByRole('button', { name: 'Animation: On' }));
    expect(setMotionEnabled).toHaveBeenCalledWith(false);
  });

  it('clears a consumed CAPTCHA and requests a fresh widget', () => {
    render(<QuietGardenDialog language="en" onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mock verification' }));
    expect(screen.getByTestId('garden').getAttribute('data-token')).toBe('proof');
    fireEvent.click(screen.getByRole('button', { name: 'Consume verification' }));
    expect(screen.getByTestId('garden').getAttribute('data-token')).toBeNull();
    expect(screen.getByRole('button', { name: 'Mock verification' }).getAttribute('data-reset')).toBe('1');
  });
});
