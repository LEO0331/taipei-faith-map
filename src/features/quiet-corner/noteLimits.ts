export const MAX_NOTE_GRAPHEMES = 80;
export const MAX_NOTE_BYTES = 1024;

export function noteTextMetrics(value: string): { graphemes: number; bytes: number } {
  // Older clients count code points conservatively; the server remains authoritative.
  const graphemes = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)].length
    : Array.from(value).length;
  return { graphemes, bytes: new TextEncoder().encode(value).byteLength };
}

export function isValidNoteText(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) return false;
  const metrics = noteTextMetrics(value.trim());
  return metrics.graphemes <= MAX_NOTE_GRAPHEMES && metrics.bytes <= MAX_NOTE_BYTES;
}

export function isQuietNoteId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
