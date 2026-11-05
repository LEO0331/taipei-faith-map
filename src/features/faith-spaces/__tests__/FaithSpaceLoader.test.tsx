// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FaithSpaceBoundary, FaithSpaceStatus } from '../FaithSpaceLoader';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('allows cancelling a pending chunk with Escape and contains keyboard focus', () => {
  const onClose = vi.fn();
  const { unmount } = render(<FaithSpaceStatus language="en" onClose={onClose} />);
  const button = screen.getByRole('button', { name: 'Return to map' });
  expect(document.activeElement).toBe(button);
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(button, { key: 'Tab' });
  expect(document.activeElement).toBe(button);
  fireEvent.keyDown(button, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledOnce();
  unmount();
  expect(document.body.style.overflow).toBe('');
});

it('keeps a failed scene chunk recoverable without removing the map', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  function BrokenScene(): never { throw new Error('Chunk unavailable'); }
  const onClose = vi.fn();
  render(<FaithSpaceBoundary language="zh" onClose={onClose}><BrokenScene /></FaithSpaceBoundary>);
  expect(screen.getByRole('alert').textContent).toContain('信仰空間載入失敗');
  fireEvent.click(screen.getByRole('button', { name: '返回地圖' }));
  expect(onClose).toHaveBeenCalledOnce();
});

it('returns programmatic focus to the loading dialog and removes its listener on unmount', () => {
  const outside = document.createElement('button');
  document.body.append(outside);
  const { unmount, rerender } = render(<FaithSpaceStatus language="en" onClose={vi.fn()} />);
  outside.focus();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Return to map' }));
  rerender(<FaithSpaceStatus language="zh" onClose={vi.fn()} />);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '返回地圖' }));
  unmount();
  outside.focus();
  expect(document.activeElement).toBe(outside);
  outside.remove();
});
