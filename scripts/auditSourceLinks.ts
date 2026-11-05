import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectCuratedAuditData, collectSourceOccurrences } from '../src/features/content-quality/contentAudit';
import { auditSourceReachability } from '../src/features/content-quality/sourceReachability';

export async function runSourceLinkAudit(args: string[]) {
  let timeoutMs = 8000, concurrency = 3, format = 'markdown';
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--timeout-ms') timeoutMs = Number(args[++index]);
    else if (args[index] === '--concurrency') concurrency = Number(args[++index]);
    else if (args[index] === '--format') format = args[++index];
    else throw new Error(`Unknown option: ${args[index]}. Use --timeout-ms, --concurrency or --format markdown|json.`);
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 15000 || !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('Use a timeout of 1000–15000 ms and concurrency of 1–4.');
  if (!['markdown', 'json'].includes(format)) throw new Error('--format must be markdown or json.');
  const urls = collectSourceOccurrences(collectCuratedAuditData()).map(occurrence => occurrence.source.url);
  const results = await auditSourceReachability(urls, { timeoutMs, concurrency });
  const report = { checkedAt: new Date().toISOString(), timeoutMs, concurrency,
    notice: 'Unauthenticated HTTP observations only. Redirects are not followed. Bot blocks, timeouts and HTTP errors do not establish that a historical claim is invalid. No references or review dates were changed.', results };
  if (format === 'json') console.log(JSON.stringify(report, null, 2));
  else console.log([`# Source link observations — ${report.checkedAt}`, '', report.notice, '', '| Source URL | Observation | HTTP status |', '| --- | --- | --- |', ...results.map(result => `| ${result.url.replace(/\|/g, '%7C')} | ${result.status} | ${result.httpStatus ?? '—'} |`)].join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runSourceLinkAudit(process.argv.slice(2)).catch(error => { console.error(error instanceof Error ? error.message : 'Source-link audit failed.'); process.exitCode = 1; });
}
