import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyPagesBuild } from './checkPagesBuild.mjs';

let directory;
const base = '/taipei-faith-map/';
const manifest = { id: './', start_url: './', scope: './', icons: [{ src: './icons/icon.svg' }] };
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'faith-pages-'));
  for (const folder of ['assets', 'icons', 'data']) await mkdir(path.join(directory, folder));
  await Promise.all([
    writeFile(path.join(directory, 'index.html'), '<link rel="manifest" href="/taipei-faith-map/manifest.webmanifest"><link href="/taipei-faith-map/icons/icon.svg"><link rel="stylesheet" href="/taipei-faith-map/assets/main.css"><script type="module" src="/taipei-faith-map/assets/main.js"></script>'),
    writeFile(path.join(directory, 'manifest.webmanifest'), JSON.stringify(manifest)),
    writeFile(path.join(directory, 'assets/main.css'), 'body{}'),
    writeFile(path.join(directory, 'assets/main.js'), 'const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/lazy.js","assets/lazy.css"])))=>i.map(i=>d[i]);import(`./lazy.js`);'),
    writeFile(path.join(directory, 'assets/lazy.js'), 'export default 1;'),
    writeFile(path.join(directory, 'assets/lazy.css'), '.lazy{}'),
    writeFile(path.join(directory, 'icons/icon.svg'), '<svg/>'),
    writeFile(path.join(directory, 'sw.js'), '// service worker'),
    writeFile(path.join(directory, 'data/religious-organizations.json'), '[]'),
    writeFile(path.join(directory, 'data/religious-summary.json'), '{}'),
  ]);
});
afterEach(async () => {
  if (directory && path.dirname(path.resolve(directory)) === path.resolve(tmpdir()) && path.basename(directory).startsWith('faith-pages-')) await rm(directory, { recursive: true, force: true });
});

describe('actual Pages build inspection', () => {
  it('accepts scoped entry, manifest and lazy chunks', async () => {
    expect(await verifyPagesBuild({ directory, base })).toMatchObject({ base, modules: 2 });
  });
  it.each(['id', 'start_url', 'scope'])('rejects a manifest %s pointing at the account root', async field => {
    await writeFile(path.join(directory, 'manifest.webmanifest'), JSON.stringify({ ...manifest, [field]: '/' }));
    await expect(verifyPagesBuild({ directory, base })).rejects.toThrow(`Manifest ${field}`);
  });
  it('rejects root-relative HTML assets outside the repository path', async () => {
    await writeFile(path.join(directory, 'index.html'), '<link href="/manifest.webmanifest"><link href="/assets/main.css"><script src="/assets/main.js"></script>');
    await expect(verifyPagesBuild({ directory, base })).rejects.toThrow('outside the deployment base');
  });
  it('rejects an icon outside the repository path', async () => {
    await writeFile(path.join(directory, 'manifest.webmanifest'), JSON.stringify({ ...manifest, icons: [{ src: '/icons/icon.svg' }] }));
    await expect(verifyPagesBuild({ directory, base })).rejects.toThrow('out-of-scope');
  });
  it('detects an entry whose lazy module was not deployed', async () => {
    await rm(path.join(directory, 'assets/lazy.js'));
    await expect(verifyPagesBuild({ directory, base })).rejects.toThrow('Missing built static asset: assets/lazy.js');
  });
  it('detects missing lazy CSS referenced only by Vite preload dependencies', async () => {
    await rm(path.join(directory, 'assets/lazy.css'));
    await expect(verifyPagesBuild({ directory, base })).rejects.toThrow('Missing built static asset: assets/lazy.css');
  });
  it('detects missing static data', async () => {
    await rm(path.join(directory, 'data/religious-organizations.json'));
    await expect(verifyPagesBuild({ directory, base })).rejects.toThrow('Missing built static asset: data/religious-organizations.json');
  });
});
