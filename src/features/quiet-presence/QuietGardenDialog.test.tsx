// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuietGardenDialog from './QuietGardenDialog';
import { getFeatureFlags } from '../../utils/featureFlags';

vi.mock('../../utils/featureFlags', () => ({ getFeatureFlags: vi.fn() }));
vi.mock('./QuietGarden', () => ({ default: ({ enabled, motionEnabled, captchaToken, challenge, notesSlot, onCaptchaConsumed }: { enabled: boolean; motionEnabled: boolean; captchaToken?: string; challenge?: React.ReactNode; notesSlot?: React.ReactNode; onCaptchaConsumed?: () => void }) => <section data-testid="garden" data-enabled={String(enabled)} data-motion={String(motionEnabled)} data-token={captchaToken}><button onClick={onCaptchaConsumed}>Consume verification</button>{challenge}{notesSlot}</section> }));
vi.mock('../quiet-corner/QuietCorner', () => ({ default: ({ onClose }: { onClose: () => void }) => <section aria-label="Notes"><button onClick={onClose}>Close notes</button></section> }));
vi.mock('../../components/GuestChallenge', () => ({ GuestChallenge: ({ onToken, resetKey }: { onToken: (value: string) => void; resetKey: number }) => <button data-reset={resetKey} onClick={() => onToken('proof')}>Mock verification</button> }));
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(getFeatureFlags).mockReturnValue({ faithMoments: true, quietPresence: true, quietCorner: false });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.style.overflow = ''; });

describe('quiet garden dialog shell', () => {
  it('enables Garden motion independently of the saved Faith Moments preference', () => {
    localStorage.setItem('taipei-faith-map-motion', 'off');
    render(<QuietGardenDialog language="en" onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('garden').getAttribute('data-motion')).toBe('true');
    expect(screen.queryByRole('button', { name: /Animation/ })).toBeNull();
  });

  it('still honors device reduced motion without offering a toggle', () => {
    const removeEventListener = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener })));
    const { unmount } = render(<QuietGardenDialog language="en" onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('garden').getAttribute('data-motion')).toBe('false');
    expect(screen.getByText(/Motion follows your device/)).toBeTruthy();
    unmount(); expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
  it('ignores controls hidden by ancestors or closed details when wrapping focus', () => {
    render(<QuietGardenDialog language="en" onLanguageChange={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const close = screen.getByRole('button', { name: 'Return to exploration' });
    const tail = document.createElement('div');
    tail.innerHTML = '<button id="last-visible">Last visible</button><div style="display:none"><button>Hidden by ancestor</button></div><div style="visibility:hidden"><button>Invisible</button></div><details><button>Closed details control</button></details><div inert><button>Inert control</button></div>';
    dialog.append(tail);
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(tail.querySelector('#last-visible'));
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
  });
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

  it('passes the disabled presence flag and preserves language without a garden motion toggle', () => {
    vi.mocked(getFeatureFlags).mockReturnValue({ faithMoments: true, quietPresence: false, quietCorner: false });
    const onLanguageChange = vi.fn();
    render(<QuietGardenDialog language="en" onLanguageChange={onLanguageChange} onClose={vi.fn()} />);
    expect(screen.getByTestId('garden').getAttribute('data-enabled')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: '中文' }));
    expect(onLanguageChange).toHaveBeenCalledWith('zh');
    expect(screen.queryByRole('button', { name: /Animation:/ })).toBeNull();
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
