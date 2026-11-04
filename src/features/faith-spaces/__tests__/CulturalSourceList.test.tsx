// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CulturalSourceList } from '../CulturalSourceList';
import type { SourceReference } from '../placeProfileTypes';

const source: SourceReference = {
  id: 'official-history', title: { zh: '官方沿革', en: 'Official history' },
  url: 'https://example.org/history', publisher: 'Example Institution', verifiedAt: '2026-11-03',
};

afterEach(() => cleanup());

describe('cultural source links', () => {
  it('identifies evidence, its publisher, destination and verification date in both languages', () => {
    const { rerender } = render(<CulturalSourceList sources={[source]} language="en" />);
    expect(screen.getByRole('heading', { name: 'Sources' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Official history — example.org (opens in a new tab)' });
    expect(link.getAttribute('href')).toBe(source.url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByText('Example Institution · example.org')).toBeTruthy();
    expect(screen.getByText(source.verifiedAt).getAttribute('dateTime')).toBe(source.verifiedAt);
    rerender(<CulturalSourceList sources={[source]} language="zh" />);
    expect(screen.getByRole('heading', { name: '資料來源' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '官方沿革 — example.org (在新分頁開啟)' })).toBeTruthy();
  });

  it('omits unsafe links while preserving safe evidence', () => {
    const unsafe = ['javascript:alert(1)', 'data:text/html,bad', '//example.org/history', 'https://name:secret@example.org/history'];
    render(<CulturalSourceList sources={[source, ...unsafe.map((url, index) => ({ ...source, id: `unsafe-${index}`, url }))]} language="en" />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link').getAttribute('href')).toBe(source.url);
  });

  it('does not render an empty bibliography for missing or unsafe evidence', () => {
    const { container, rerender } = render(<CulturalSourceList sources={[]} language="en" />);
    expect(container.childElementCount).toBe(0);
    rerender(<CulturalSourceList sources={[{ ...source, url: 'javascript:alert(1)' }]} language="en" />);
    expect(container.childElementCount).toBe(0);
  });
});
