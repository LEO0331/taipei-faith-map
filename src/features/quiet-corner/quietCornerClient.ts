import { getFeatureFlags } from '../../utils/featureFlags';
import { getGuestSession, getOptionalSupabaseClient } from '../../services/supabaseClient';
import { isQuietNoteId, isValidNoteText } from './noteLimits';
import { QuietCornerError } from './quietCornerTypes';
import type { QuietNote, QuietReportReason } from './quietCornerTypes';

const REQUEST_TIMEOUT_MS = 10_000;
const reasons: QuietReportReason[] = ['unsafe', 'personal-data', 'spam', 'other'];

function enabled() {
  if (!getFeatureFlags().quietCorner) throw new QuietCornerError('unavailable');
}

async function bounded<T>(operation: (signal: AbortSignal) => PromiseLike<T>, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new QuietCornerError('unavailable');
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, REQUEST_TIMEOUT_MS);
  let rejectAbort: (() => void) | undefined;
  const cancellation = new Promise<never>((_resolve, reject) => {
    rejectAbort = () => reject(new QuietCornerError('unavailable'));
    controller.signal.addEventListener('abort', rejectAbort, { once: true });
  });
  try { return await Promise.race([Promise.resolve(operation(controller.signal)), cancellation]); }
  finally {
    clearTimeout(timer); signal?.removeEventListener('abort', abort);
    if (rejectAbort) controller.signal.removeEventListener('abort', rejectAbort);
  }
}

/** Only display fields are returned, even if a misconfigured response includes metadata. */
export function sanitizeApprovedNotes(value: unknown, now = Date.now()): QuietNote[] {
  if (!Array.isArray(value)) throw new QuietCornerError('unavailable');
  const notes: QuietNote[] = [];
  const ids = new Set<string>();
  for (const raw of value.slice(0, 15)) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    if (!isQuietNoteId(row.id) || ids.has(row.id) || !isValidNoteText(row.content)) continue;
    if ('status' in row && row.status !== 'approved') continue;
    if (typeof row.expires_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/u.test(row.expires_at)) continue;
    const expiresAt = Date.parse(row.expires_at);
    if (!Number.isFinite(expiresAt) || expiresAt <= now) continue;
    ids.add(row.id);
    notes.push({ id: row.id, content: row.content, expiresAt: row.expires_at });
  }
  return notes;
}

export async function readApprovedNotes(signal?: AbortSignal): Promise<QuietNote[]> {
  enabled();
  return bounded(async requestSignal => {
    const client = await getOptionalSupabaseClient();
    if (!client || requestSignal.aborted) throw new QuietCornerError('unavailable');
    const result = await client.rpc('get_approved_quiet_notes', { p_limit: 15 }).abortSignal(requestSignal);
    if (result.error) throw new QuietCornerError('unavailable');
    return sanitizeApprovedNotes(result.data);
  }, signal);
}

async function invokeQuietFunction(name: 'submit-quiet-note' | 'report-quiet-note', body: Record<string, unknown>, captchaToken: string | undefined, signal?: AbortSignal) {
  enabled();
  return bounded(async requestSignal => {
    if (requestSignal.aborted) throw new QuietCornerError('unavailable');
    let captchaConsumed = false;
    const client = await getGuestSession({ captchaToken, onCaptchaConsumed: () => { captchaConsumed = true; } });
    if (requestSignal.aborted) throw new QuietCornerError('unavailable');
    if (captchaConsumed) throw new QuietCornerError('fresh-verification');
    const result = await client.functions.invoke(name, { body: { ...body, ...(captchaToken ? { captchaToken } : {}) }, signal: requestSignal, timeout: REQUEST_TIMEOUT_MS });
    let data = result.data as { ok?: unknown; error?: unknown } | null;
    if (result.error && typeof result.error === 'object' && 'context' in result.error && result.error.context instanceof Response) {
      const response = result.error.context;
      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const body = await response.clone().json() as unknown;
          if (body && typeof body === 'object') data = body as { error?: unknown };
        } catch { /* Only recognized, safe error codes influence the UI. */ }
      }
    }
    if (result.error || data?.ok !== true) {
      const code = data?.error;
      if (code === 'posting-disabled' || code === 'rate-limited' || code === 'duplicate' || code === 'verification-required') throw new QuietCornerError(code);
      throw new QuietCornerError('unavailable');
    }
  }, signal);
}

export async function submitQuietNote(content: string, captchaToken?: string, signal?: AbortSignal): Promise<void> {
  if (!isValidNoteText(content)) throw new QuietCornerError('invalid');
  await invokeQuietFunction('submit-quiet-note', { content: content.trim() }, captchaToken, signal);
}

export async function reportQuietNote(noteId: string, reason: QuietReportReason, captchaToken?: string, signal?: AbortSignal): Promise<void> {
  if (!isQuietNoteId(noteId) || !reasons.includes(reason)) throw new QuietCornerError('invalid');
  await invokeQuietFunction('report-quiet-note', { noteId, reason }, captchaToken, signal);
}
