export const NOTE_GRAPHEME_LIMIT = 80;
export const NOTE_BYTE_LIMIT = 1024;
export const REQUEST_BYTE_LIMIT = 4096;
export const REPORT_REASONS = ['unsafe', 'personal-data', 'spam', 'other'] as const;
export type ReportReason = typeof REPORT_REASONS[number];

const encoder = new TextEncoder();
const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });
export const utf8Length = (value: string) => encoder.encode(value).byteLength;
export const graphemeLength = (value: string) => [...segmenter.segment(value)].length;

export function validateNoteText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const content = value.normalize('NFC').replace(/\r\n?/gu, '\n').trim();
  if (!content || utf8Length(content) > NOTE_BYTE_LIMIT || graphemeLength(content) > NOTE_GRAPHEME_LIMIT) return undefined;
  // A compact plain-text board: reject hidden controls, markup and link-shaped input.
  // This validation is not moderation; every accepted note still starts pending.
  if (/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(content) || /\p{Surrogate}/u.test(content) || /[<>]/u.test(content) || /(?:https?:\/\/|www\.|mailto:)/iu.test(content)) return undefined;
  return content;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
export function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).every(key => keys.includes(key));
}
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value);
}
export function validCaptchaToken(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= 2048 && !/[\s\u0000-\u001f\u007f]/u.test(value);
}
