import { describe, expect, it } from 'vitest';
import { formatHistoricalDate, sortHistoricalMilestones } from '../heritageLookup';
import { validateHistoricalDate } from '../heritageValidation';
import type { HistoricalDate, HistoricalMilestone } from '../heritageTypes';

const date = (values: Partial<HistoricalDate> = {}): HistoricalDate => ({ precision: 'year', calendarSystem: 'gregorian', startYear: 1937, displayLabel: { zh: '1937年', en: '1937' }, ...values });
const milestone = (id: string, value: HistoricalDate): HistoricalMilestone => ({ id, date: value, title: { zh: id, en: id }, summary: { zh: '來源摘要', en: 'Sourced summary' }, theme: 'architecture', organizationIds: [], storyIds: [], sources: [], lastReviewed: '2026-11-04', editorialReviewStatus: 'internal-reviewed' });

describe('historical date precision', () => {
  it('accepts exact dates only when Gregorian evidence, calendar date and source year agree', () => {
    expect(validateHistoricalDate(date({ precision: 'exact', exactDate: '1937-11-04' }))).toEqual([]);
    expect(validateHistoricalDate(date({ precision: 'exact', exactDate: '1937-02-30' })).join(' ')).toContain('valid Gregorian');
    expect(validateHistoricalDate(date({ precision: 'exact', exactDate: '1938-11-04' })).join(' ')).toContain('must agree');
    expect(validateHistoricalDate(date({ precision: 'exact', calendarSystem: 'lunar', exactDate: '1937-11-04' })).join(' ')).toContain('Gregorian');
    expect(validateHistoricalDate(date({ precision: 'exact' })).join(' ')).toContain('Gregorian');
  });

  it('preserves year-only and approximate labels without inventing a day', () => {
    const approximate = date({ precision: 'approximate', displayLabel: { zh: '約1937年前後', en: 'Around 1937' } });
    expect(validateHistoricalDate(approximate)).toEqual([]);
    expect(formatHistoricalDate(approximate, 'zh')).toBe('約1937年前後');
    expect(formatHistoricalDate(approximate, 'en')).toBe('Around 1937');
    expect(formatHistoricalDate(date(), 'en')).toBe('1937');
    expect(validateHistoricalDate(date({ exactDate: '1937-01-01' })).join(' ')).toContain('non-exact');
  });

  it('requires chronological ranges and an honest unknown-date representation', () => {
    expect(validateHistoricalDate(date({ precision: 'range', startYear: 1920, endYear: 1929, displayLabel: { zh: '1920年代', en: 'The 1920s' } }))).toEqual([]);
    expect(validateHistoricalDate(date({ precision: 'range', endYear: 1900 })).join(' ')).toContain('chronological');
    expect(validateHistoricalDate(date({ precision: 'range' })).join(' ')).toContain('chronological');
    const unknown = date({ precision: 'unknown', startYear: undefined, displayLabel: { zh: '確切年代不詳', en: 'Exact period unknown' } });
    expect(validateHistoricalDate(unknown)).toEqual([]);
    expect(formatHistoricalDate(unknown, 'en')).toBe('Exact period unknown');
    expect(validateHistoricalDate({ ...unknown, startYear: 1900 }).join(' ')).toContain('invented');
  });

  it.each([0, -1, 10000, 1937.5, NaN, Infinity])('rejects an invalid historical year %s', startYear => {
    expect(validateHistoricalDate(date({ startYear })).join(' ')).toContain('integer');
  });

  it('requires bilingual labels, a known precision and an explicit calendar system', () => {
    expect(validateHistoricalDate(date({ displayLabel: { zh: '1937年', en: '' } })).join(' ')).toContain('displayLabel.en');
    expect(validateHistoricalDate(date({ precision: 'decade' as HistoricalDate['precision'] })).join(' ')).toContain('precision');
    expect(validateHistoricalDate(date({ calendarSystem: undefined as unknown as HistoricalDate['calendarSystem'] })).join(' ')).toContain('calendarSystem');
    expect(validateHistoricalDate(date({ endYear: 1938 })).join(' ')).toContain('only valid for range');
  });

  it('sorts known years chronologically, exact dates consistently and undated records last without mutation', () => {
    const items = [
      milestone('unknown-b', date({ precision: 'unknown', startYear: undefined })),
      milestone('later-day', date({ precision: 'exact', exactDate: '1937-12-01' })),
      milestone('range', date({ precision: 'range', startYear: 1920, endYear: 1929 })),
      milestone('earlier-day', date({ precision: 'exact', exactDate: '1937-01-01' })),
      milestone('unknown-a', date({ precision: 'unknown', startYear: undefined })),
      milestone('approximate', date({ precision: 'approximate', startYear: 1900 })),
    ];
    const original = [...items];
    expect(sortHistoricalMilestones(items).map(item => item.id)).toEqual(['approximate', 'range', 'earlier-day', 'later-day', 'unknown-a', 'unknown-b']);
    expect(items).toEqual(original);
    expect(sortHistoricalMilestones([...items].reverse()).map(item => item.id)).toEqual(sortHistoricalMilestones(items).map(item => item.id));
  });
});
