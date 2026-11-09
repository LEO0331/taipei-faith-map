// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import organizationsJson from '../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../types';
import * as relatedContent from '../utils/relatedContent';
import { RelatedCulturalContent } from './RelatedCulturalContent';

const organizations = organizationsJson as ReligiousOrganization[];
const organization = organizations.find(item => item.id === 'org-21-1bs6r0m')!;
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-05T04:00:00Z')); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

it('shows bilingual typed links and sends the exact related target after focusing its control', async () => {
  const onNavigate = vi.fn();
  const { rerender } = render(<RelatedCulturalContent organization={organization} organizations={organizations} language="zh" onNavigate={onNavigate} />);
  expect(screen.getByRole('heading', { name: '相關文化探索' })).toBeTruthy();
  const targets = relatedContent.getRelatedCulturalItems(organization, organizations, '2026-11-05');
  const button = screen.getByRole('button', { name: new RegExp(targets[0].title.zh) });
  fireEvent.click(button);
  expect(onNavigate).toHaveBeenCalledExactlyOnceWith(targets[0].target);
  expect(document.activeElement).toBe(button);
  await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
  rerender(<RelatedCulturalContent organization={organization} organizations={organizations} language="en" onNavigate={onNavigate} />);
  expect(screen.getByRole('heading', { name: 'Related Cultural Content' })).toBeTruthy();
  expect(screen.getByText('Historical links refer to current registered places, not verified historical coordinates.')).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(targets.length);
});

it('handles a rejected navigation with a translated retry message and usable controls', async () => {
  const onNavigate = vi.fn().mockRejectedValue(new Error('Unavailable internal detail'));
  const { rerender } = render(<RelatedCulturalContent organization={organization} organizations={organizations} language="en" onNavigate={onNavigate} />);
  const button = screen.getAllByRole('button')[0];
  fireEvent.click(button);
  await screen.findByRole('alert');
  expect(screen.getByRole('alert').textContent).toBe('Related content could not be opened. Please try again.');
  expect(screen.queryByText('Unavailable internal detail')).toBeNull();
  await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
  expect(document.activeElement).toBe(button);
  rerender(<RelatedCulturalContent organization={organization} organizations={organizations} language="zh" onNavigate={onNavigate} />);
  expect(screen.getByRole('alert').textContent).toBe('相關內容暫時無法開啟，請再試一次。');
});

it('renders no empty section for an unrelated or mismatched record', () => {
  const unrelated = organizations.find(item => item.id === 'org-2-y94nau')!;
  const { container, rerender } = render(<RelatedCulturalContent organization={unrelated} organizations={organizations} language="en" onNavigate={vi.fn()} />);
  expect(container.childElementCount).toBe(0);
  rerender(<RelatedCulturalContent organization={{ ...organization, name: '不同名稱' }} organizations={organizations} language="en" onNavigate={vi.fn()} />);
  expect(container.childElementCount).toBe(0);
});

it('renders related labels as React text rather than HTML', () => {
  vi.spyOn(relatedContent, 'getRelatedCulturalItems').mockReturnValue([{ target: { kind: 'route', id: 'safe-id', organizationId: organization.id }, title: { zh: '<script>測試</script>', en: '<img src=x onerror=alert(1)>' } }]);
  const { container } = render(<RelatedCulturalContent organization={organization} organizations={organizations} language="en" onNavigate={vi.fn()} />);
  expect(container.querySelector('img,script')).toBeNull();
  expect(screen.getByRole('button').textContent).toContain('<img src=x onerror=alert(1)>');
});
