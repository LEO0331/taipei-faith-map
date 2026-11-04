// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { Language } from '../../../types';
import { TraditionIntroduction } from '../TraditionIntroduction';
import { traditionContent } from '../traditionContent';
import { getFaithSpaceConfig } from '../faithSpaceConfig';

afterEach(cleanup);

it.each(traditionContent)('shows sourced bilingual context in the neutral gallery for $religion', content => {
  const { rerender } = render(<TraditionIntroduction religion={content.religion} language="zh" />);
  for (const language of ['zh', 'en'] as Language[]) {
    rerender(<TraditionIntroduction religion={content.religion} language={language} />);
    expect(screen.getByRole('heading', { name: content.title[language] })).toBeTruthy();
    expect(screen.getByText(content.introduction[language])).toBeTruthy();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2026-11-03/).length).toBeGreaterThan(0);
    expect(getFaithSpaceConfig(content.religion).id).toBe('generic');
  }
});

it('keeps unsupported traditions on the neutral fallback without an empty section', () => {
  const { container } = render(<TraditionIntroduction religion="未分類" language="en" />);
  expect(container.childElementCount).toBe(0);
});
