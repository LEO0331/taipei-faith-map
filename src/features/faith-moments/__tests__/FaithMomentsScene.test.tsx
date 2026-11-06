// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import FaithSpaceModal from '../../faith-spaces/FaithSpaceModal';
import { getFaithSpaceConfig } from '../../faith-spaces/faithSpaceConfig';
import type { ReligiousOrganization } from '../../../types';

const organization: ReligiousOrganization = { id: 'moments-fixture', name: '示意場所', religion: '道教', district: '萬華區', address: '測試地址', festivalDates: [], originalX: 0, originalY: 0, latitude: 25.04, longitude: 121.5, source: 'Test fixture' };
const props = { organization, language: 'en' as const, onClose: vi.fn(), onLanguageChange: vi.fn() };
beforeEach(() => {
  localStorage.clear(); vi.useFakeTimers(); vi.stubEnv('VITE_FAITH_MOMENTS_ENABLED', 'true');
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('shows cultural text immediately while optional movement settles and cleans up on exit', () => {
  const { container, unmount } = render(<FaithSpaceModal {...props} />);
  const avatar = () => container.querySelector('[data-visitor-action]')!;
  expect(avatar().getAttribute('data-visitor-action')).toBe('idle');
  const lantern = getFaithSpaceConfig('道教').hotspots[1];
  fireEvent.click(screen.getByRole('button', { name: lantern.title.en }));
  expect(screen.getByText(lantern.body.en)).toBeTruthy();
  expect(avatar().getAttribute('data-visitor-action')).toBe('walk');
  act(() => vi.advanceTimersByTime(600));
  expect(avatar().getAttribute('data-visitor-action')).toBe('observe');
  fireEvent.click(screen.getByRole('button', { name: 'Wave' }));
  expect(avatar().getAttribute('data-visitor-action')).toBe('wave');
  act(() => vi.advanceTimersByTime(500));
  expect(avatar().getAttribute('data-visitor-action')).toBe('idle');
  fireEvent.click(screen.getByRole('button', { name: 'Walk' }));
  unmount(); expect(vi.getTimerCount()).toBe(0);
});

it('keeps motion off across language changes and a new scene without delaying information', () => {
  const first = render(<FaithSpaceModal {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Animation Off' }));
  const lantern = getFaithSpaceConfig('道教').hotspots[1];
  fireEvent.click(screen.getByRole('button', { name: lantern.title.en }));
  expect(screen.getByText(lantern.body.en)).toBeTruthy();
  expect(first.container.querySelector('[data-visitor-action]')?.getAttribute('data-visitor-action')).toBe('observe');
  act(() => vi.advanceTimersByTime(2000));
  expect(first.container.querySelector('[data-visitor-action]')?.getAttribute('data-visitor-action')).toBe('observe');
  first.rerender(<FaithSpaceModal {...props} language="zh" />);
  expect(screen.getByRole('button', { name: '關閉動畫' }).getAttribute('aria-pressed')).toBe('true');
  first.unmount();
  render(<FaithSpaceModal {...props} organization={{ ...organization, religion: '佛教' }} />);
  expect(screen.getByRole('button', { name: 'Animation Off' }).getAttribute('aria-pressed')).toBe('true');
  expect(localStorage.getItem('taipei-faith-map-motion')).toBe('off');
});

it('can disable the avatar independently while all cultural hotspots keep working', () => {
  vi.stubEnv('VITE_FAITH_MOMENTS_ENABLED', 'false');
  const { container } = render(<FaithSpaceModal {...props} />);
  expect(container.querySelector('[data-visitor-action]')).toBeNull();
  const target = getFaithSpaceConfig('道教').hotspots[2];
  fireEvent.click(screen.getByRole('button', { name: target.title.en }));
  expect(screen.getByText(target.body.en)).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Faith Moments' })).toBeNull();
});
