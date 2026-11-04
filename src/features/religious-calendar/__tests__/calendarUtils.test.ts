import { describe, expect, it } from 'vitest';
import { daysInMonth, eventOccursOn, eventsInMonth, formatCalendarDate, getTaipeiMonth, getTaipeiToday, isRecentVerification, monthDays, shiftMonth, upcomingEvents } from '../calendarUtils';
import { buildFestivalReferences } from '../festivalReferences';
import { testEvent, testOrganization } from './calendarFixtures';

describe('Taipei calendar dates', () => {
  it('follows Taipei midnight rather than browser or UTC day boundaries', () => {
    expect(getTaipeiToday(new Date('2026-11-03T15:59:59Z'))).toBe('2026-11-03');
    expect(getTaipeiToday(new Date('2026-11-03T16:00:00Z'))).toBe('2026-11-04');
    expect(getTaipeiMonth(new Date('2026-12-31T16:00:00Z'))).toBe('2027-01');
  });

  it('handles leap years, month lengths and cross-year navigation', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('1900-02')).toBe(28);
    expect(daysInMonth('2000-02')).toBe(29);
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthDays('2026-11').filter(Boolean)).toHaveLength(30);
    expect(monthDays('2026-11')[0]).toBe('2026-11-01');
    expect(monthDays('2026-11').length % 7).toBe(0);
  });

  it('includes all days of an occurrence across months and years without shifting date-only values', () => {
    const event = { ...testEvent, startDate: '2026-12-30', endDate: '2027-01-02' };
    expect(eventsInMonth([event], '2026-12')).toEqual([event]);
    expect(eventsInMonth([event], '2027-01')).toEqual([event]);
    expect(eventsInMonth([event], '2027-02')).toEqual([]);
    expect(eventOccursOn(event, '2027-01-01')).toBe(true);
    expect(eventOccursOn(event, '2027-01-03')).toBe(false);
    expect(formatCalendarDate('2027-01-01', 'en')).toBe('January 1, 2027');
    expect(formatCalendarDate('2027-01-01', 'zh')).toContain('2027年1月1日');
  });

  it('only calls confirmed, published, non-ended occurrences upcoming', () => {
    const cancelled = { ...testEvent, id: 'cancelled', status: 'cancelled' as const };
    const postponed = { ...testEvent, id: 'postponed', status: 'postponed' as const };
    const pending = { ...testEvent, id: 'pending', editorialReviewStatus: 'pending' as const };
    expect(upcomingEvents([cancelled, testEvent, postponed, pending], '2026-11-30')).toEqual([testEvent]);
    expect(upcomingEvents([testEvent], '2026-12-01')).toEqual([]);
    expect(upcomingEvents([{ ...testEvent, startDate: '2026-02-30' }], '2026-01-01')).toEqual([]);
  });

  it('retains every original festival string without converting or creating dated events', () => {
    const references = buildFestivalReferences([testOrganization]);
    expect(references.map(item => item.originalDateText)).toEqual(testOrganization.festivalDates);
    expect(references.map(item => item.calendarSystem)).toEqual(['lunar', 'gregorian', 'unknown']);
    expect(references.every(item => item.interpretationStatus === 'unparsed')).toBe(true);
    expect(references.every(item => !('startDate' in item))).toBe(true);
    expect(upcomingEvents([], '2026-11-04')).toEqual([]);
    expect(buildFestivalReferences([{ ...testOrganization, festivalDates: ['農曆1月1日或國曆1月1日'] }])[0].calendarSystem).toBe('unknown');
  });

  it('labels recent and older source checks transparently without claiming live verification', () => {
    expect(isRecentVerification('2026-11-01', '2026-11-30')).toBe(true);
    expect(isRecentVerification('2026-10-01', '2026-11-30')).toBe(false);
    expect(isRecentVerification('2026-12-01', '2026-11-30')).toBe(false);
  });
});
