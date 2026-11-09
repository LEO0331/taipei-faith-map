import { describe, expect, it } from 'vitest';
import { decodeTrackerState, encodeTrackerState, planIssue, trackerTitle } from './monthlyReviewIssue.mjs';

const record = { id: 'a'.repeat(24), fingerprint: 'b'.repeat(24), group: 'source', scope: 'source-abcdef' };
const run = 'https://github.com/LEO0331/taipei-faith-map/actions/runs/123';
const report = { notify: true, baselineMatches: true, tracked: [record], findings: [{ ...record, code: 'http-missing', link: 'https://www.travel.taipei/file/34731/' }] };

describe('monthly tracking issue', () => {
  it('creates one initial summary and skips the same evidence on another run', () => {
    const update = planIssue(report, undefined, run);
    expect(update.title).toBe(trackerTitle);
    expect(update.body).toContain(report.findings[0].link);
    expect(decodeTrackerState(update.body)).toEqual([record]);
    expect(planIssue(report, update, run.replace('123', '456'))).toBeNull();
  });
  it('writes a new summary for changed evidence and never emits an issue state change', () => {
    const issue = { body: encodeTrackerState([record]), state: 'closed' };
    const changed = { ...record, fingerprint: 'c'.repeat(24) };
    const update = planIssue({ ...report, tracked: [changed] }, issue, run);
    expect(update.state).toBeUndefined();
    expect(decodeTrackerState(update.body)).toEqual([changed]);
    const cleared = planIssue({ ...report, tracked: [] }, issue, run);
    expect(cleared.body).toContain('no longer observed: 1');
    expect(cleared.state).toBeUndefined();
  });
  it('refuses invalid tracker entries and preserves uncertainty without duplicating issues', () => {
    expect(planIssue({ ...report, notify: false }, undefined, run)).toBeNull();
    expect(planIssue({ ...report, baselineMatches: false }, undefined, run)).toBeNull();
    expect(() => planIssue(report, { body: 'manually edited marker' }, run)).toThrow();
    expect(() => encodeTrackerState([{ ...record, scope: 'raw personal text' }])).toThrow();
  });
  it('drops unsafe links and raw finding text', () => {
    const update = planIssue({ ...report, findings: [
      { ...report.findings[0], link: 'https://example.org/?token=do-not-leak' },
      { ...report.findings[0], scope: 'person@example.org' },
    ] }, undefined, run);
    expect(update.body).not.toMatch(/do-not-leak|person@/);
  });
});
