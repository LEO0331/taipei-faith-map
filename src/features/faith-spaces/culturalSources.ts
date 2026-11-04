/** Only absolute web destinations are allowed; credentials and hidden controls are rejected. */
export function getSafeSourceUrl(value: string): string | undefined {
  if (typeof value !== 'string' || !value || value !== value.trim() || /[\u0000-\u0020\u007f-\u009f\\]/u.test(value)) return undefined;
  if (!/^https?:\/\//i.test(value)) return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
