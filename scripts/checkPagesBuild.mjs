import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Inspect actual build output without network access or any privileged configuration. */
export async function verifyPagesBuild({ directory = 'dist', base = '/taipei-faith-map/' } = {}) {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error('Expected a plain rooted deployment base ending in slash.');
  const root = path.resolve(directory);
  const site = new URL(base, 'https://pages-build.invalid');
  let checked = 0;
  async function verifyFile(url) {
    if (url.origin !== site.origin || !url.pathname.startsWith(site.pathname) || url.search || url.hash) throw new Error('Build contains an out-of-scope static asset URL.');
    const relative = decodeURIComponent(url.pathname.slice(site.pathname.length));
    const filename = path.resolve(root, relative);
    if (path.relative(root, filename).startsWith('..') || path.isAbsolute(path.relative(root, filename))) throw new Error('Build asset leaves the output directory.');
    try { if (!(await stat(filename)).isFile()) throw new Error('not a file'); }
    catch { throw new Error(`Missing built static asset: ${relative.slice(0, 160)}`); }
    checked++;
    return filename;
  }
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const links = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
  if (!links.some(url => url.endsWith('.js')) || !links.some(url => url.endsWith('.css'))) throw new Error('Built HTML must reference its entry JavaScript and stylesheet.');
  if (links.some(url => !url.startsWith(base))) throw new Error('Built HTML contains an asset outside the deployment base.');
  for (const link of links) await verifyFile(new URL(link, site));
  const manifestLinks = links.filter(url => url.endsWith('/manifest.webmanifest'));
  if (manifestLinks.length !== 1) throw new Error('Built HTML must reference exactly one scoped manifest.');
  const manifestUrl = new URL(manifestLinks[0], site);
  const manifest = JSON.parse(await readFile(await verifyFile(manifestUrl), 'utf8'));
  for (const field of ['id', 'start_url', 'scope']) {
    if (typeof manifest[field] !== 'string' || new URL(manifest[field], manifestUrl).href !== site.href) throw new Error(`Manifest ${field} must resolve to the deployment root.`);
  }
  if (!Array.isArray(manifest.icons) || !manifest.icons.length) throw new Error('Manifest icons are missing.');
  for (const icon of manifest.icons) {
    if (typeof icon.src !== 'string') throw new Error('Manifest icon source is missing.');
    await verifyFile(new URL(icon.src, manifestUrl));
  }
  for (const filename of ['sw.js', 'data/religious-organizations.json', 'data/religious-summary.json']) await verifyFile(new URL(filename, site));
  const assets = await readdir(path.join(root, 'assets'));
  let modules = 0;
  for (const filename of assets.filter(name => name.endsWith('.js'))) {
    modules++;
    const moduleUrl = new URL(`assets/${filename}`, site);
    const javascript = await readFile(await verifyFile(moduleUrl), 'utf8');
    for (const match of javascript.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)["'`](\.[^"'`]+)["'`]/g)) await verifyFile(new URL(match[1], moduleUrl));
    // Vite's preload dependency map includes lazy CSS that has no import in the
    // emitted JavaScript. Check its generated root-relative asset literals too,
    // without evaluating build output or depending on a particular bundle hash.
    for (const match of javascript.matchAll(/(["'`])(assets\/[A-Za-z0-9_./-]{1,512}\.(?:js|css|woff2?|png|svg|webp))\1/g)) await verifyFile(new URL(match[2], site));
  }
  return { base, checkedFiles: checked, modules };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyPagesBuild({ directory: process.argv[2] || 'dist', base: process.argv[3] || '/taipei-faith-map/' });
    console.log(`Pages build check passed: ${result.modules} modules; ${result.checkedFiles} asset references under ${result.base}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Pages build check failed.');
    process.exitCode = 1;
  }
}
