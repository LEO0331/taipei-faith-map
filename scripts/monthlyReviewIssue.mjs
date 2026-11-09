import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

export const trackerTitle = 'Monthly Cultural Content Review — Action Required';
const marker = /<!-- taipei-monthly-review-v1:([A-Za-z0-9_-]+) -->/;
const id = /^[a-f0-9]{24}$/;
const scope = /^[\p{L}\p{N}_./-]{1,160}$/u;
const groups = ['government', 'editorial', 'source', 'calendar'];
const maxStateBytes = 1_500_000;

function checkedState(items) {
  if (!Array.isArray(items) || items.length > 5000) throw new Error('Invalid tracker state');
  const seen = new Set();
  return items.map(item => {
    if (!item || typeof item.id !== 'string' || !id.test(item.id)
      || typeof item.fingerprint !== 'string' || !id.test(item.fingerprint)
      || typeof item.scope !== 'string' || !scope.test(item.scope) || !groups.includes(item.group) || seen.has(item.id)) throw new Error('Invalid tracker entry');
    seen.add(item.id);
    const { id: findingId, fingerprint, group, scope: area } = item;
    return { id: findingId, fingerprint, group, scope: area };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

export function encodeTrackerState(items) {
  const state = checkedState(items);
  const payload = deflateRawSync(JSON.stringify(state)).toString('base64url');
  if (payload.length > 48000) throw new Error('Tracker state exceeds the safe issue body size');
  return `<!-- taipei-monthly-review-v1:${payload} -->`;
}

export function decodeTrackerState(body) {
  const payload = typeof body === 'string' && body.match(marker)?.[1];
  if (!payload || payload.length > 48000) throw new Error('Invalid tracker marker');
  return checkedState(JSON.parse(inflateRawSync(Buffer.from(payload, 'base64url'), { maxOutputLength: maxStateBytes }).toString('utf8')));
}

function safeLink(input) {
  if (typeof input !== 'string' || /[<>\s\\]/.test(input)) return undefined;
  try {
    const url = new URL(input);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port
      || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) || !/[a-z]$/i.test(url.hostname)
      || /\.(?:local|localhost|internal|test|example)$/i.test(url.hostname)
      || [...url.searchParams.keys()].some(key => /token|secret|password|api.?key|auth|session/i.test(key))) return undefined;
    url.hash = '';
    return url.href;
  } catch { return undefined; }
}

export function planIssue(report, existing, runUrl) {
  if (report?.notify !== true || report.baselineMatches !== true) return null;
  const oldState = existing ? decodeTrackerState(existing.body) : [];
  const state = checkedState(report.tracked);
  if (JSON.stringify(state) === JSON.stringify(oldState)) return null;
  const oldFingerprints = new Set(oldState.map(item => item.fingerprint));
  const newFingerprints = new Set(state.map(item => item.fingerprint).filter(value => !oldFingerprints.has(value)));
  const currentIds = new Set(state.map(item => item.id));
  const absent = oldState.filter(item => !currentIds.has(item.id));
  const findings = (Array.isArray(report.findings) ? report.findings : [])
    .filter(item => item && newFingerprints.has(item.fingerprint) && typeof item.id === 'string' && id.test(item.id)
      && typeof item.code === 'string' && scope.test(item.code) && typeof item.scope === 'string' && scope.test(item.scope));
  const lines = [
    '# Cultural content review',
    '',
    `New or changed evidence: ${newFingerprints.size}. Currently tracked: ${state.length}. Previously tracked and no longer observed: ${absent.length}.`,
    '',
    ...findings.slice(0, 30).map(item => {
      const link = safeLink(item.link);
      return `- ${item.code} · ${item.scope} · ${item.id}${link ? ` · <${link}>` : ''}`;
    }),
    ...(findings.length > 30 ? ['See the workflow JSON report for additional entries.'] : []),
    '',
    'Review the original sources and current registration identities. Request a separate owner-reviewed content or baseline PR for any correction.',
    'These observations may be incomplete. A missing record is a candidate for review. Inconclusive checks retain previously tracked evidence.',
    '',
    `Workflow evidence and downloadable report: ${runUrl}`,
    '',
    encodeTrackerState(state),
  ];
  return { title: trackerTitle, body: lines.join('\n') };
}

async function api(path, options = {}) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!token || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Tracker access unavailable');
  const response = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...options, redirect: 'error', signal: AbortSignal.timeout(12000),
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'x-github-api-version': '2022-11-28' },
  });
  if (!response.ok || !response.body) throw new Error('Tracker API unavailable');
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4 * 1024 * 1024) throw new Error('Tracker API response exceeds its bound');
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { void reader.cancel().catch(() => undefined); }
}

async function findTracker() {
  // List bot-owned trackers directly. Search-index delay must not create duplicates.
  const found = [];
  for (let page = 1; page <= 10; page++) {
    const issues = await api(`/issues?state=all&per_page=50&page=${page}`);
    if (!Array.isArray(issues)) throw new Error('Tracker list unavailable');
    found.push(...issues.filter(issue => !issue.pull_request && issue.user?.login === 'github-actions[bot]'
      && issue.title === trackerTitle && Number.isSafeInteger(issue.number) && issue.number > 0));
    if (issues.length < 50) {
      if (found.length > 1) throw new Error('Multiple trackers require manual reconciliation');
      return found[0];
    }
  }
  throw new Error('Tracker search was incomplete');
}

async function main(operation, filename) {
  if (!filename) throw new Error('Output path required');
  if (operation === '--read') {
    let prior;
    try {
      const issue = await findTracker();
      prior = { available: true, tracked: issue ? decodeTrackerState(issue.body) : [] };
    } catch { prior = { available: false, tracked: [] }; }
    await writeFile(filename, JSON.stringify(prior) + '\n');
    return;
  }
  if (operation !== '--notify') throw new Error('Unsupported tracker operation');
  const repo = process.env.GITHUB_REPOSITORY;
  const run = process.env.GITHUB_RUN_ID;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo) || !run || !/^\d+$/.test(run)) throw new Error('Missing workflow run information');
  const report = JSON.parse(await readFile(filename, 'utf8'));
  if (report.notify !== true) return;
  const issue = await findTracker();
  const update = planIssue(report, issue, `https://github.com/${repo}/actions/runs/${run}`);
  if (!update) return;
  // The owner controls whether the tracking issue is open or closed.
  await api(issue ? `/issues/${issue.number}` : '/issues', { method: issue ? 'PATCH' : 'POST', body: JSON.stringify(update) });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv[2], process.argv[3]).catch(() => {
    console.error('Tracking issue operation incomplete. Inspect the sanitized report and check repository permissions.');
    process.exitCode = 1;
  });
}
