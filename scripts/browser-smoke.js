import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';

const dir = mkdtempSync(join(tmpdir(), 'tcf-browser-'));
const config = loadConfig({ DATA_DIR: dir, REQUESTS_PER_MINUTE: '100', REQUESTS_PER_DAY: '1000' });
const { app, store } = createApp(config);
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
config.PUBLIC_ORIGIN = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(config.PUBLIC_ORIGIN);
  await page.locator('#question:enabled').waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.locator('#mode-notice').textContent(), /DEMO EXPERIENCE/);
  mkdirSync('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.getByRole('button', { name: /EXPLORE A PASSAGE/ }).click();
  await page.getByRole('heading', { name: 'Abiding in Christ', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Read source: John 15:1–8', exact: true }).first().click();
  assert.equal(await page.locator('.source-card').first().getAttribute('open'), '');
  assert.match(await page.locator('.scripture-text').first().textContent(), /I am the true vine/);
  assert.equal(await page.locator('.source-card').first().getByRole('link', { name: /Read this passage on Blue Letter Bible/ }).getAttribute('href'), 'https://www.blueletterbible.org/csb/jhn/15/1/');
  assert.equal(await page.getByRole('link', { name: 'Study this passage further in Blue Letter Bible (CSB) ↗' }).getAttribute('href'), 'https://www.blueletterbible.org/csb/jhn/15/1/');
  await page.getByRole('button', { name: 'How can I apply this today?', exact: true }).click();
  await page.getByRole('heading', { name: 'Abiding in Christ: putting it into practice' }).waitFor();
  await page.screenshot({ path: 'test-results/study.png', fullPage: true });
  await page.locator('.new-study').click();
  await page.locator('#welcome:visible').waitFor(); assert.equal(await page.locator('.turn').count(), 0);
  // Exercise the BLB gateway as a visitor, including its new-tab navigation.
  await context.route('https://www.blueletterbible.org/search/search.cfm**', route => route.fulfill({ contentType: 'text/html', body: '<title>BLB destination</title>' }));
  await page.locator('[data-study-mode="blb"]').click();
  await page.locator('#blb-gateway:visible').waitFor();
  assert.equal(await page.locator('.composer-wrap').isHidden(), true);
  async function searchBlb(criteria) {
    await page.locator('#tcf-blb-criteria').fill(criteria);
    const popupPromise = context.waitForEvent('page');
    await page.locator('.tcf-blb-submit').click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    const url = new URL(popup.url());
    await popup.close();
    assert.equal(url.origin, 'https://www.blueletterbible.org');
    assert.equal(url.pathname, '/search/search.cfm');
    return url;
  }
  let blbUrl = await searchBlb('Romans 10');
  assert.equal(blbUrl.searchParams.get('Criteria'), 'Romans 10');
  assert.equal(blbUrl.searchParams.get('t'), 'CSB');
  assert.equal(blbUrl.searchParams.has('cscs'), false);
  await page.locator('.tcf-blb-summary').click();
  await page.locator('#tcf-blb-range').fill('Rom 10');
  blbUrl = await searchBlb('faith');
  assert.equal(blbUrl.searchParams.get('Criteria'), 'faith');
  assert.equal(blbUrl.searchParams.get('t'), 'CSB');
  assert.equal(blbUrl.searchParams.get('cscs'), 'Rom 10');
  await page.locator('[data-study-mode="explore"]').click();
  assert.equal(await page.locator('.composer-wrap').isVisible(), true);
  // Mobile interaction and layout, including keyboard submission and modal focus.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.locator('#question').fill('What is grace?'); await page.locator('#question').press('Enter');
  await page.getByRole('heading', { name: 'Grace: received, then lived' }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.getByRole('button', { name: 'Privacy & limitations' }).click();
  await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  // Render untrusted question text as text, never markup.
  await page.locator('#question').fill('<img src=x onerror="window.__unsafe=true"> grace');
  await page.locator('#send-button').click();
  await page.locator('.turn').nth(1).getByRole('heading', { name: 'Grace: received, then lived' }).waitFor();
  assert.equal(await page.evaluate(() => window.__unsafe), undefined);
  assert.equal(await page.locator('.question-bubble img').count(), 0);
  // Model two HTTPS production origins. Chrome correctly blocks public pages
  // from framing loopback directly (Local Network Access), so proxy the test's
  // HTTPS app origin to our real local server without disabling browser security.
  const localRoot = config.PUBLIC_ORIGIN;
  const browserOrigin = 'https://study.tcf.example';
  // Keep PUBLIC_ORIGIN at its local value to exercise a real preview/proxy
  // origin mismatch. Preserve the browser's Fetch Metadata through the proxy.
  await context.route(`${browserOrigin}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = await request.allHeaders();
    // Playwright intercepts before Chromium adds its network-stack Fetch
    // Metadata headers. Recreate that one header only after checking that
    // the browser's request Origin and owning frame both match this app.
    if (headers.origin === url.origin && new URL(request.frame().url()).origin === url.origin)
      headers['sec-fetch-site'] = 'same-origin';
    const response = await context.request.fetch(localRoot + url.pathname + url.search, {
      method: request.method(), headers, ...(request.postData() ? { data: request.postData() } : {}),
    });
    await route.fulfill({ response });
  });
  await context.route('https://thecruciblesfire.org/embed-test', route => route.fulfill({ contentType: 'text/html', body: `<html><head><link rel="icon" href="data:,"></head><body><iframe title="Bible study" src="${browserOrigin}" width="800" height="900"></iframe></body></html>` }));
  await page.goto('https://thecruciblesfire.org/embed-test');
  const frame = page.frameLocator('iframe');
  await frame.locator('#question:enabled').waitFor();
  await frame.getByRole('button', { name: /LOOK A LITTLE CLOSER/ }).click();
  await frame.getByRole('heading', { name: 'The Shepherd who stays near' }).waitFor();
  assert.equal((await context.cookies()).length, 0);
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: desktop, mobile, passage sources, follow-up, reset, dialog, XSS text, and cross-site iframe without cookies.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve)); store.close(); rmSync(dir, { recursive: true, force: true });
}
