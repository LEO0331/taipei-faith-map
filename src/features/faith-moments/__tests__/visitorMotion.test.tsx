// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarActions } from '../AvatarActions';
import { VisitorAvatar } from '../VisitorAvatar';
import { MOTION_STORAGE_KEY, useVisitorMotion, VISITOR_TIMING } from '../useVisitorMotion';
import type { VisitorMotionController } from '../useVisitorMotion';

let visitor: VisitorMotionController;
function Harness({ language = 'en' as 'en' | 'zh' }) {
  visitor = useVisitorMotion();
  return <><VisitorAvatar action={visitor.action} position={visitor.position} motionEnabled={visitor.motionEnabled} /><AvatarActions language={language} controller={visitor} /></>;
}
const action = () => visitor.action;

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function media(initial: boolean) {
  let reduced = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ get matches() { return reduced; }, addEventListener: (_name: string, callback: () => void) => listeners.add(callback), removeEventListener: (_name: string, callback: () => void) => listeners.delete(callback) })));
  return { listeners, change(next: boolean) { act(() => { reduced = next; listeners.forEach(callback => callback()); }); } };
}

describe('original visitor motion', () => {
  it('renders idle without an opening animation or action timer', () => {
    const { container } = render(<Harness />);
    expect(action()).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
    expect(container.querySelector('.faith-visitor')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Animation On' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('walks to an illustrative foreground location, observes, then settles within 1.2 seconds', () => {
    render(<Harness />);
    act(() => visitor.walkTo({ id: 'roof', x: 20, y: 27 }));
    expect(action()).toBe('walk');
    expect(visitor.position).toEqual({ x: 20, y: 72 });
    act(() => vi.advanceTimersByTime(VISITOR_TIMING.walk));
    expect(action()).toBe('observe');
    act(() => vi.advanceTimersByTime(VISITOR_TIMING.observe));
    expect(action()).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
    expect(VISITOR_TIMING.walk + VISITOR_TIMING.observe).toBeLessThan(1200);
  });

  it('supports the five neutral controls and cancels a previous action before a new gesture', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Walk' }));
    expect(action()).toBe('walk');
    act(() => vi.advanceTimersByTime(200));
    fireEvent.click(screen.getByRole('button', { name: 'Wave' }));
    expect(action()).toBe('wave');
    act(() => vi.advanceTimersByTime(VISITOR_TIMING.wave));
    expect(action()).toBe('idle');
    fireEvent.click(screen.getByRole('button', { name: 'Sit' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(action()).toBe('sit');
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Observe' }));
    expect(action()).toBe('observe');
    fireEvent.click(screen.getByRole('button', { name: 'Rest' }));
    expect(action()).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lets the visitor skip immediately and removes pending timers when the scene closes', () => {
    const { unmount } = render(<Harness />);
    act(() => visitor.walkTo({ x: 75, y: 65 }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip movement' }));
    expect(action()).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
    act(() => visitor.walkTo({ x: 25, y: 65 }));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('honors reduced motion and never restores motion after an explicit off preference', () => {
    const device = media(true);
    const { unmount } = render(<Harness />);
    expect(visitor.motionEnabled).toBe(false);
    act(() => visitor.walkTo({ x: 80, y: 70 }));
    expect(visitor.position).toEqual({ x: 80, y: 84 });
    expect(action()).toBe('observe');
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Animation Off' }));
    device.change(false);
    expect(visitor.motionEnabled).toBe(false);
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('off');
    unmount();
    expect(device.listeners.size).toBe(0);
    render(<Harness />);
    expect(visitor.motionEnabled).toBe(false);
  });

  it('disables in-flight movement immediately and changes poses without timers when animation is off', () => {
    render(<Harness />);
    act(() => visitor.walkTo({ x: 80, y: 70 }));
    fireEvent.click(screen.getByRole('button', { name: 'Animation Off' }));
    expect(action()).toBe('idle');
    act(() => vi.advanceTimersByTime(0)); // JSDOM defers its own storage notification.
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Wave' }));
    expect(action()).toBe('wave');
    expect(vi.getTimerCount()).toBe(0);
    expect(localStorage.length).toBe(1);
  });

  it('keeps an explicit off choice even if browser storage is unavailable', () => {
    render(<Harness />);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    fireEvent.click(screen.getByRole('button', { name: 'Animation Off' }));
    expect(visitor.motionEnabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Sit' }));
    expect(action()).toBe('sit');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('updates bilingual controls without resetting the current pose or preference', () => {
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Sit' }));
    rerender(<Harness language="zh" />);
    expect(screen.getByRole('button', { name: '坐一會' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '關閉動畫' })).toBeTruthy();
    expect(action()).toBe('sit');
  });

  it('ignores invalid coordinates instead of rendering invalid movement styles', () => {
    render(<Harness />);
    act(() => visitor.walkTo({ x: Number.NaN, y: 50 }));
    expect(action()).toBe('idle');
    expect(visitor.position).toEqual({ x: 50, y: 83 });
  });
});
