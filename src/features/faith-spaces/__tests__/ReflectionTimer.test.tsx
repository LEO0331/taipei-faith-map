// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReflectionTimer } from '../ReflectionTimer';

describe('quiet reflection timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T00:00:00Z'));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const clock = () => screen.getByLabelText('Time remaining').textContent;

  it('starts, pauses without losing fractions, resumes and resets', () => {
    render(<ReflectionTimer language="en" />);
    expect(clock()).toBe('01:00');
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(10_500));
    expect(clock()).toBe('00:50');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => vi.advanceTimersByTime(20_000));
    expect(clock()).toBe('00:50');
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    act(() => vi.advanceTimersByTime(500));
    expect(clock()).toBe('00:49');
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(clock()).toBe('01:00');
    expect(screen.getByText('Ready')).toBeTruthy();
  });

  it('offers all presets and finishes using elapsed wall time when the tab returns', () => {
    render(<ReflectionTimer language="en" />);
    fireEvent.click(screen.getByRole('button', { name: '3 min' }));
    expect(clock()).toBe('03:00');
    fireEvent.click(screen.getByRole('button', { name: '5 min' }));
    expect(clock()).toBe('05:00');
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    vi.setSystemTime(new Date('2026-11-03T00:06:00Z'));
    fireEvent(document, new Event('visibilitychange'));
    expect(clock()).toBe('00:00');
    expect(screen.getByText('Reflection complete')).toBeTruthy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('updates language without resetting the running timer and cleans up on unmount', () => {
    const { rerender, unmount } = render(<ReflectionTimer language="en" />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(5_000));
    rerender(<ReflectionTimer language="zh" />);
    expect(screen.getByLabelText('剩餘時間').textContent).toBe('00:55');
    expect(screen.getByRole('button', { name: '暫停' })).toBeTruthy();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
