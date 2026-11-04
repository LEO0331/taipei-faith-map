import type { Language } from '../../types';
import type { ConfirmedCulturalEvent } from './calendarTypes';
import { isValidDateOnly } from '../../utils/curatedContent';

export function getTaipeiToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getTaipeiMonth(now: Date = new Date()): string { return getTaipeiToday(now).slice(0, 7); }

export function daysInMonth(month: string): number {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number, 0)).getUTCDate();
}

export function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthDays(month: string): Array<string | null> {
  const first = new Date(`${month}-01T12:00:00Z`).getUTCDay();
  const cells: Array<string | null> = Array.from({ length: first }, () => null);
  for (let day = 1; day <= daysInMonth(month); day++) cells.push(`${month}-${String(day).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function formatCalendarDate(date: string, language: Language, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-TW' : 'en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long', day: 'numeric', ...options }).format(new Date(`${date}T04:00:00Z`));
}

export function formatCalendarMonth(month: string, language: Language): string {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-TW' : 'en-US', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'long' }).format(new Date(`${month}-01T04:00:00Z`));
}

export function eventOccursOn(event: ConfirmedCulturalEvent, date: string): boolean {
  return isValidDateOnly(date) && isValidDateOnly(event.startDate) && isValidDateOnly(event.endDate) && event.startDate <= date && event.endDate >= date;
}

export function eventsInMonth<T extends ConfirmedCulturalEvent>(events: T[], month: string): T[] {
  const first = `${month}-01`;
  const last = `${month}-${daysInMonth(month)}`;
  return events.filter(event => isValidDateOnly(event.startDate) && isValidDateOnly(event.endDate) && event.startDate <= last && event.endDate >= first)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
}

export function upcomingEvents<T extends ConfirmedCulturalEvent>(events: T[], today = getTaipeiToday()): T[] {
  return events.filter(event => event.status === 'confirmed' && event.editorialReviewStatus !== 'pending' && isValidDateOnly(event.startDate) && isValidDateOnly(event.endDate) && event.endDate >= today && event.endDate >= event.startDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
}

export function isRecentVerification(verifiedAt: string, today = getTaipeiToday()): boolean {
  if (!isValidDateOnly(verifiedAt) || !isValidDateOnly(today)) return false;
  const ageDays = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${verifiedAt}T00:00:00Z`)) / 86_400_000;
  return ageDays >= 0 && ageDays <= 30;
}
