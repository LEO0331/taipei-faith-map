// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuietGarden from '../QuietGarden';
import { joinQuietGarden } from '../presenceClient';

vi.mock('../presenceClient', () => ({ joinQuietGarden: vi.fn() }));
const key = 'c6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1';
const connection = { guestKey: key, leave: vi.fn(async () => undefined), perform: vi.fn(async () => true) };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(joinQuietGarden).mockResolvedValue(connection); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('optional quiet garden', () => {
  it('does not connect, authenticate or fabricate peers before explicit opt-in', () => {
    const { container } = render(<QuietGarden language="en" enabled onClose={vi.fn()} />);
    expect(joinQuietGarden).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Enter Quiet Garden' })).toBeTruthy();
    expect(screen.queryByText(/Other connected visitors:/)).toBeNull();
  });

  it('shows only received live peers, permits neutral actions, and leaves immediately', async () => {
    const { container } = render(<QuietGarden language="en" enabled captchaToken="proof" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter Quiet Garden' }));
    await screen.findByRole('button', { name: 'Leave shared garden' });
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(1);
    expect(screen.getByText('No other visitors are connected here right now.')).toBeTruthy();
    const options = vi.mocked(joinQuietGarden).mock.calls[0][0];
    act(() => options.onPeers([{ guestKey: 'd6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1', avatarVariant: 'clay', gesture: 'sit' }]));
    expect(screen.getByText('Other connected visitors: 1')).toBeTruthy();
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Sit quietly' }));
    await waitFor(() => expect(connection.perform).toHaveBeenCalledWith('sit'));
    fireEvent.click(screen.getByRole('button', { name: 'Wave' }));
    await waitFor(() => expect(connection.perform).toHaveBeenCalledWith('wave'));
    fireEvent.click(screen.getByRole('button', { name: 'Leave shared garden' }));
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(0);
    expect(options.signal?.aborted).toBe(true);
    expect(connection.leave).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Enter Quiet Garden' })).toBeTruthy();
  });

  it('never connects when disabled, and missing service fails with the bilingual solo fallback', async () => {
    const props = { onClose: vi.fn() };
    const { rerender } = render(<QuietGarden {...props} language="en" enabled={false} />);
    expect(screen.queryByRole('button', { name: 'Enter Quiet Garden' })).toBeNull();
    expect(joinQuietGarden).not.toHaveBeenCalled();
    vi.mocked(joinQuietGarden).mockRejectedValue(new Error('Unavailable service detail'));
    rerender(<QuietGarden {...props} language="en" enabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter Quiet Garden' }));
    await screen.findByText('Shared presence is temporarily unavailable. Solo exploration remains available.');
    expect(screen.queryByText('Unavailable service detail')).toBeNull();
    rerender(<QuietGarden {...props} language="zh" enabled />);
    expect(screen.getByText('共享空間目前無法使用，仍可自由探索。')).toBeTruthy();
  });

  it('offers an unattributed greeting without animating the peer claimed by a broadcast', async () => {
    const { container } = render(<QuietGarden language="en" enabled onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter Quiet Garden' }));
    await screen.findByRole('button', { name: 'Leave shared garden' });
    const options = vi.mocked(joinQuietGarden).mock.calls[0][0];
    const peerKey = 'd6244e7a-c5bc-4f8b-b3d4-7ebc2738a7c1';
    act(() => options.onPeers([{ guestKey: peerKey, avatarVariant: 'clay', gesture: 'sit' }]));
    act(() => options.onGesture?.({ guestKey: peerKey, gesture: 'wave', nonce: 1 }));
    expect(screen.getByRole('button', { name: 'Acknowledge a greeting' })).toBeTruthy();
    expect(container.querySelector('.garden-visitor:not(.garden-own)')?.classList.contains('garden-gesture-sit')).toBe(true);
    expect(container.querySelector('.garden-gesture-wave')).toBeNull();
  });

  it('does not describe an interrupted connection as a known empty garden', async () => {
    render(<QuietGarden language="en" enabled onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter Quiet Garden' }));
    await screen.findByRole('button', { name: 'Leave shared garden' });
    act(() => vi.mocked(joinQuietGarden).mock.calls[0][0].onStatus?.('reconnecting'));
    expect(screen.getByText('The shared connection is interrupted; waiting briefly to reconnect.')).toBeTruthy();
    expect(screen.queryByText('No other visitors are connected here right now.')).toBeNull();
    expect(screen.queryByText(/Other connected visitors:/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Wave' }).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Wave' }));
    expect(connection.perform).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Leave shared garden' })).toBeTruthy();
  });

  it('pauses on browser backgrounding without resuming automatically and cleans up on unmount', async () => {
    const { unmount } = render(<QuietGarden language="en" enabled onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter Quiet Garden' }));
    await screen.findByRole('button', { name: 'Leave shared garden' });
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    expect(screen.getByText(/shared connection was paused/)).toBeTruthy();
    expect(connection.leave).toHaveBeenCalledOnce();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));
    expect(joinQuietGarden).toHaveBeenCalledOnce();
    unmount();
    expect(connection.leave).toHaveBeenCalledOnce();
  });

  it('bounds loading and discards a late connection after leave or close', async () => {
    vi.useFakeTimers();
    let resolveJoin!: (value: typeof connection) => void;
    vi.mocked(joinQuietGarden).mockImplementation(() => new Promise(resolve => { resolveJoin = resolve; }));
    const { container } = render(<QuietGarden language="en" enabled onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter Quiet Garden' }));
    await act(() => vi.advanceTimersByTimeAsync(10_001));
    expect(screen.getByText('Shared presence is temporarily unavailable. Solo exploration remains available.')).toBeTruthy();
    await act(async () => { resolveJoin(connection); await Promise.resolve(); });
    expect(connection.leave).toHaveBeenCalledOnce();
    expect(container.querySelectorAll('.garden-visitor')).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('updates language without connecting and honors the explicit animation-off presentation', () => {
    const { container, rerender } = render(<QuietGarden language="zh" enabled motionEnabled={false} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: '進入靜心庭院' })).toBeTruthy();
    expect(container.querySelector('.quiet-garden')?.getAttribute('data-motion')).toBe('off');
    rerender(<QuietGarden language="en" enabled motionEnabled={false} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Enter Quiet Garden' })).toBeTruthy();
    expect(joinQuietGarden).not.toHaveBeenCalled();
  });
});
