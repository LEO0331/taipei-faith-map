import { describe, expect, it } from 'vitest';
import { isValidNoteText, noteTextMetrics } from '../noteLimits';

describe('Quiet Corner text limits', () => {
  it('counts Unicode graphemes instead of UTF-16 code units', () => {
    expect(noteTextMetrics('👨‍👩‍👧‍👦e\u0301')).toMatchObject({ graphemes: 2 });
    expect(isValidNoteText('祝'.repeat(80))).toBe(true);
    expect(isValidNoteText('祝'.repeat(81))).toBe(false);
    expect(isValidNoteText(' 👋🏽 ')).toBe(true);
  });
  it('rejects empty/control text and bounds oversized combining clusters by bytes', () => {
    expect(isValidNoteText(' \n ')).toBe(false);
    expect(isValidNoteText('hello\u0000world')).toBe(false);
    expect(isValidNoteText('a' + '\u0301'.repeat(600))).toBe(false);
    expect(isValidNoteText('A calm\nmoment.')).toBe(true);
  });
});
