import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

// Actual Chromium against the built static app. This suite never opts into Auth,
// solves CAPTCHA, fabricates peers or changes a remote posting switch.
const root = path.resolve(process.env.FAITH_BROWSER_DIST || 'dist');
const artifacts = path.resolve('.supabase-test/browser-results');
await mkdir(artifacts, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
let generation = 'initial';
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  if (!url.pathname.startsWith('/taipei-faith-map/')) { response.writeHead(404).end(); return; }
  const relative = decodeURIComponent(url.pathname.slice('/taipei-faith-map/'.length)) || 'index.html';
  const filename = path.resolve(root, relative);
  if (path.relative(root, filename).startsWith('..')) { response.writeHead(403).end(); return; }
  try {
    let body = await readFile(filename);
    if (relative === 'index.html') body = Buffer.from(body.toString().replace('</head>', `<meta name="browser-probe-generation" content="${generation}"></head>`));
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/taipei-faith-map/`;
const browser = await chromium.launch({ headless: true, chromiumSandbox: true });
const results = [];
const record = (name, details = {}) => { const result = { name, status: 'passed', ...details }; results.push(result); console.log(JSON.stringify(result)); };
const sample = JSON.parse(await readFile(path.join(root, 'data/religious-organizations.json'), 'utf8'))[0];
const labels = {
  en: { welcome: 'Explore a Faith Space', close: 'Close Faith Space', wave: 'Wave', off: 'Animation Off' },
  zh: { welcome: '探索一處信仰空間', close: '關閉信仰空間', wave: '揮揮手', off: '關閉動畫' },
};
const discovery = {
  en: { routes: 'Walking Routes', route: 'Three temple stories in Bangka', next: 'Next stop', chapters: 'Start chapters', milestone: /^Read on the timeline:/, location: 'View current registered location', backHistory: 'Return to History & Stories', backRoute: 'Return to the walking route', calendar: 'Calendar', calendarTitle: 'Religious Calendar', map: 'Map' },
  zh: { routes: '散步路線', route: '艋舺三處廟宇文化', next: '下一站', chapters: '開始閱讀章節', milestone: /^在時間軸閱讀:/, location: '查看目前登記位置', backHistory: '返回歷史與故事', backRoute: '返回原本的散步路線', calendar: '行事曆', calendarTitle: '宗教文化行事曆', map: '地圖' },
};
async function checkDiscoveryAccessibility(page, selector) {
  const violations = await page.evaluate(async target => {
    const result = await window.axe.run(document.querySelector(target), {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    });
    return result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }));
  }, selector);
  assert.equal(violations.length, 0, JSON.stringify(violations));
}
try {
  for (const width of [1280, 768, 390, 375, 320]) for (const language of ['zh', 'en']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: width === 375 ? 'reduce' : 'no-preference' });
    try {
      await context.addInitScript(value => localStorage.setItem('taipei-faith-map-language', value), language);
      const page = await context.newPage();
      const optionalRequests = [];
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.hostname.endsWith('.supabase.co') || url.hostname === 'challenges.cloudflare.com' || /\/dist-[\w-]+\.js$/.test(url.pathname)) optionalRequests.push(url.hostname);
      });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const welcome = page.getByRole('button', { name: labels[language].welcome, exact: true });
      await expect(welcome).toBeEnabled();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Home overflow at ${width}/${language}`);
      await page.screenshot({ path: path.join(artifacts, `home-${width}-${language}.png`) });
      await page.getByRole('searchbox').fill(sample.name);
      await welcome.focus(); await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: sample.name, exact: true });
      await expect(dialog).toBeVisible();
      const close = dialog.getByRole('button', { name: labels[language].close, exact: true });
      await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await dialog.evaluate(element => element.contains(document.activeElement)), true);
      await page.keyboard.press('Tab'); await expect(close).toBeFocused();
      const hotspot = dialog.locator('.faith-hotspot').nth(1);
      const title = await hotspot.getAttribute('aria-label');
      await hotspot.click();
      await expect(dialog.locator('.faith-detail h2')).toHaveText(title);
      await expect(dialog.locator('.faith-detail p')).toBeVisible();
      await dialog.locator('.visitor-actions').getByRole('button', { name: labels[language].wave, exact: true }).click();
      if (width === 375) {
        await expect(dialog.locator('.faith-visitor')).not.toHaveClass(/visitor-motion/);
        assert.equal(await dialog.locator('.visitor-right-arm').evaluate(element => getComputedStyle(element).animationName), 'none');
      }
      await dialog.getByRole('button', { name: labels[language].off, exact: true }).click();
      await expect(dialog.locator('.faith-visitor')).not.toHaveClass(/visitor-motion/);
      assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true, `Dialog overflow at ${width}/${language}`);
      await page.screenshot({ path: path.join(artifacts, `scene-${width}-${language}.png`) });
      for (const control of [close, hotspot, dialog.getByRole('button', { name: labels[language].off, exact: true })]) {
        const bounds = await control.boundingBox();
        assert(bounds && bounds.width >= 44 && bounds.height >= 44, 'Critical control is below 44px');
      }
      if (width === 1280 || width === 320) {
        await page.addScriptTag({ path: path.resolve('node_modules/axe-core/axe.min.js') });
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run(document.querySelector('.faith-dialog'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
          return result.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }));
        });
        assert.equal(violations.length, 0, JSON.stringify(violations));
      }
      await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(welcome).toBeFocused();
      await expect(page.getByRole('searchbox')).toHaveValue(sample.name);
      const words = discovery[language];
      const nav = page.locator('.discovery-navigation');
      await nav.getByRole('button', { name: words.routes, exact: true }).click();
      await page.locator('.cultural-route-card').filter({ has: page.getByRole('heading', { name: words.route, exact: true }) }).getByRole('button').click();
      await page.getByRole('button', { name: words.next, exact: true }).click();
      const stop = page.locator('.route-stop-detail > h4');
      const stopTitle = await stop.textContent();
      const routeSpace = page.locator('.route-stop-detail').getByRole('button', {
        name: language === 'zh' ? '探索信仰空間' : 'Explore Faith Space', exact: true,
      });
      await routeSpace.click();
      const routeDialog = page.getByRole('dialog');
      await expect(routeDialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(routeDialog).toHaveCount(0);
      await expect(routeSpace).toBeFocused();
      const history = page.locator('[data-route-history="wanhua-temple-heritage"]');
      await history.click();
      await page.getByRole('button', { name: words.chapters, exact: true }).click();
      if (width === 1280 || width === 320) await checkDiscoveryAccessibility(page, '.heritage-workspace');
      await page.getByRole('button', { name: words.milestone }).first().click();
      await page.getByRole('button', { name: words.location, exact: true }).first().click();
      await page.getByRole('button', { name: words.backHistory, exact: true }).click();
      await page.getByRole('button', { name: words.backRoute, exact: true }).click();
      await expect(stop).toHaveText(stopTitle ?? '');
      await expect(history).toBeFocused();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (width === 1280 || width === 320) await checkDiscoveryAccessibility(page, '.cultural-routes');
      if (width === 320) {
        await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
        const overflow = await page.evaluate(() => {
          if (document.documentElement.scrollWidth <= innerWidth) return [];
          const offenders = [...document.querySelectorAll('body *')]
            .filter(element => !element.closest('.leaflet-container') && element.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 8).map(element => element.getAttribute('class') || element.tagName);
          return [`document width ${document.documentElement.scrollWidth}`, ...offenders];
        });
        assert.deepEqual(overflow, [], 'Route overflows at enlarged root text');
        await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
      }
      await nav.getByRole('button', { name: words.calendar, exact: true }).click();
      await expect(page.getByRole('heading', { name: words.calendarTitle, exact: true })).toBeVisible();
      await nav.getByRole('button', { name: words.map, exact: true }).click();
      await expect(page.getByRole('searchbox')).toHaveValue(sample.name);
      if (width === 1280) {
        await context.setGeolocation({ latitude: sample.latitude, longitude: sample.longitude });
        await context.grantPermissions(['geolocation'], { origin: new URL(base).origin });
        await page.getByRole('button', { name: language === 'zh' ? '顯示附近宗教團體' : 'Show nearby religious organizations', exact: true }).click();
        await expect(page.locator('.nearby-list')).toContainText(sample.name);
        record('nearby-discovery', { language, location: 'simulated' });
      }
      record('route-history-calendar-journey', { width, language });
      assert.equal(optionalRequests.length, 0, 'Solo exploration requested an optional service or SDK');
      record('static-browser-journey', { width, language, reducedMotion: width === 375 });
    } finally { await context.close(); }
  }
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => caches.open('unrelated-browser-test-cache'));
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20000 });
    const keys = await page.evaluate(() => caches.keys());
    assert(keys.includes('unrelated-browser-test-cache'));
    const cachedUrls = await page.evaluate(async () => {
      const urls = [];
      for (const name of await caches.keys()) if (name.startsWith('taipei-faith-map:')) for (const key of await (await caches.open(name)).keys()) urls.push(key.url);
      return urls;
    });
    assert(cachedUrls.length > 0);
    assert(cachedUrls.every(url => url.startsWith(base)));
    generation = 'updated';
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('meta[name="browser-probe-generation"]')).toHaveAttribute('content', 'updated');
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: labels.zh.welcome, exact: true })).toBeEnabled();
    record('pwa-cached-shell-and-fresh-html', { cachedPublicAssets: cachedUrls.length, unvisitedLazyFeaturesAndTilesGuaranteed: false });
  } finally { await context.close(); }
  await import('node:fs/promises').then(fs => fs.writeFile(path.join(artifacts, 'summary.json'), JSON.stringify({ browser: browser.version(), results }, null, 2)));
  console.log(JSON.stringify({ browser: browser.version(), passed: results.length, hostedPositiveAuthVerified: false }));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
