import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ReligiousOrganization } from '../src/types';
import { auditCuratedContent, collectCuratedAuditData, formatContentAudit } from '../src/features/content-quality/contentAudit';
import { isValidDateOnly } from '../src/utils/curatedContent';

export async function runContentAudit(args: string[]): Promise<number> {
  let asOf: string | undefined, format = 'markdown';
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--as-of') {
      asOf = args[++index];
      if (!asOf || !isValidDateOnly(asOf)) throw new Error('--as-of requires a valid YYYY-MM-DD date.');
    }
    else if (args[index] === '--format') format = args[++index];
    else throw new Error(`Unknown option: ${args[index]}. Use --as-of YYYY-MM-DD and --format markdown|json.`);
  }
  if (asOf !== undefined && !isValidDateOnly(asOf)) throw new Error('--as-of requires a valid YYYY-MM-DD date.');
  if (!['markdown', 'json'].includes(format)) throw new Error('--format must be markdown or json.');
  const organizations = JSON.parse(await readFile(resolve('public/data/religious-organizations.json'), 'utf8')) as ReligiousOrganization[];
  const report = auditCuratedContent(collectCuratedAuditData(), organizations, asOf);
  console.log(format === 'json' ? JSON.stringify(report, null, 2) : formatContentAudit(report));
  return report.errors.length || report.government.errors.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runContentAudit(process.argv.slice(2)).then(code => { process.exitCode = code; }).catch(error => { console.error(error instanceof Error ? error.message : 'Content audit failed.'); process.exitCode = 1; });
}
