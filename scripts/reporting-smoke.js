import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { createDemoProviders } from '../server/demo.js';

const dir = mkdtempSync(join(tmpdir(), 'tcf-reporting-'));
const config = loadConfig({ APP_MODE: 'live', TCF_OPENAI_API_KEY: 'fixture-openai',
  TCF_BIBLE_API_KEY: 'fixture-bible', BIBLE_ID: 'fixture-translation', DATA_DIR: dir });
const demo = createDemoProviders();
const { app, store } = createApp(config, { providers: { ...demo,
  async bible(reference) { return { ...await demo.bible(reference), fumsToken: `fixture-${reference}` }; },
} });
const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
const root = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), headless: true });
  const context = await browser.newContext();
  const requests = [];
  let initialize = false;
  await context.route('https://pkg.api.bible/fumsV3.min.js', route => {
    requests.push(route.request().url());
    // A script that downloads without installing the client must fail closed.
    return route.fulfill({ contentType: 'application/javascript', body: initialize
      ? 'window.fums = function(command, tokens) { window.receivedFums = {command, tokens}; return Promise.resolve(); };'
      : '/* fixture: script loaded but client did not initialize */' });
  });
  const page = await context.newPage();
  const csp = await page.goto(root);
  assert.match(csp.headers()['content-security-policy'], /script-src 'self' https:\/\/pkg.api.bible/);
  assert.match(csp.headers()['content-security-policy'], /connect-src 'self' https:\/\/fums.api.bible/);
  await page.getByRole('button', { name: 'Reconnect', exact: true }).waitFor();
  assert.ok(await page.locator('#question').isDisabled());
  assert.match(await page.locator('#request-status').textContent(), /could not initialize/);
  assert.equal(store.summary().length, 0);
  initialize = true;
  await page.getByRole('button', { name: 'Reconnect', exact: true }).click();
  await page.locator('#question:enabled').waitFor();
  await page.locator('#question').fill('John 15:1–8'); await page.locator('#send-button').click();
  await page.getByRole('heading', { name: 'Abiding in Christ', exact: true }).waitFor();
  const reported = await page.evaluate(() => window.receivedFums);
  assert.equal(reported.command, 'trackView'); assert.equal(reported.tokens.length, 3);
  assert.equal(await page.getByRole('link', { name: 'API.Bible', exact: true }).getAttribute('href'), 'https://api.bible');
  assert.equal(requests.length, 2);
  assert.ok(!await page.locator('body').textContent().then(text => text.includes('fixture-openai')));
  console.log('Reporting browser contract passed: current script/CSP, failed initialization, reconnect, source-token submission, and attribution. Providers are fixtures; no paid calls.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve)); store.close(); rmSync(dir, { recursive: true, force: true });
}
