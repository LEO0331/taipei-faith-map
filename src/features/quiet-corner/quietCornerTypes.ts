export type QuietNote = { id: string; content: string; expiresAt: string };
export type QuietReportReason = 'unsafe' | 'personal-data' | 'spam' | 'other';
export type QuietCornerFailure = 'unavailable' | 'invalid' | 'verification-required' | 'fresh-verification' | 'posting-disabled' | 'rate-limited' | 'duplicate';

export class QuietCornerError extends Error {
  constructor(public readonly code: QuietCornerFailure) { super(code); this.name = 'QuietCornerError'; }
}
