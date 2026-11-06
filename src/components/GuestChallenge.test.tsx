// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GuestChallenge } from './GuestChallenge';

afterEach(() => { cleanup(); delete window.turnstile; vi.restoreAllMocks(); });

describe('optional guest verification', () => {
  it('loads no third-party script until the visitor explicitly starts verification', async () => {
    const onToken = vi.fn();
    render(<GuestChallenge language="en" action="quiet-garden" siteKey="public_site_key" onToken={onToken} />);
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Verify guest access' }));
    const script = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com"]');
    expect(script?.src).toBe('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
    expect(script?.referrerPolicy).toBe('no-referrer');
    await act(async () => { script?.dispatchEvent(new Event('error')); });
    expect(screen.getByText(/Guest verification is unavailable/)).toBeTruthy();
    expect(script?.isConnected).toBe(false);
    expect(onToken).not.toHaveBeenCalledWith(expect.any(String));
  });

  it('passes the intended action, expires tokens, and removes widgets on reset and unmount', async () => {
    const renderWidget = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');
    const remove = vi.fn();
    window.turnstile = { render: renderWidget, remove };
    const onToken = vi.fn();
    const props = { language: 'en' as const, action: 'quiet-note' as const, siteKey: 'public_site_key', onToken, autoStart: true };
    const { rerender, unmount } = render(<GuestChallenge {...props} />);
    await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
    const options = renderWidget.mock.calls[0][1];
    expect(options.action).toBe('quiet-note');
    act(() => options.callback('verified-token'));
    expect(onToken).toHaveBeenLastCalledWith('verified-token');
    expect(screen.getByText('Verification complete.')).toBeTruthy();
    act(() => options['expired-callback']());
    expect(onToken).toHaveBeenLastCalledWith(undefined);
    rerender(<GuestChallenge {...props} resetKey={1} />);
    await waitFor(() => expect(renderWidget).toHaveBeenCalledTimes(2));
    expect(remove).toHaveBeenCalledWith('first');
    unmount();
    expect(remove).toHaveBeenCalledWith('second');
    onToken.mockClear();
    act(() => options.callback('stale-token'));
    expect(onToken).not.toHaveBeenCalled();
  });

  it('does not load a provider for missing configuration and rejects oversized callbacks', async () => {
    const renderWidget = vi.fn().mockReturnValue('widget');
    window.turnstile = { render: renderWidget, remove: vi.fn() };
    const onToken = vi.fn();
    const { rerender } = render(<GuestChallenge language="zh" action="quiet-report" siteKey="" onToken={onToken} autoStart />);
    expect(screen.getByText(/訪客驗證目前無法使用/)).toBeTruthy();
    expect(renderWidget).not.toHaveBeenCalled();
    rerender(<GuestChallenge language="zh" action="quiet-report" siteKey="public_site_key" onToken={onToken} autoStart />);
    await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce());
    onToken.mockClear();
    act(() => renderWidget.mock.calls[0][1].callback('x'.repeat(4097)));
    expect(onToken).not.toHaveBeenCalled();
  });
});
