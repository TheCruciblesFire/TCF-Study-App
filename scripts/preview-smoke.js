import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), headless:true });
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors = [], network = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  // Managed Chromium disallows file:// navigation. Load the exact bundled
  // document into a blank page; any attempted HTTP asset/API load is recorded.
  await page.setContent(readFileSync('preview/tcf-study-demo.html','utf8'));
  await page.locator('#question:enabled').waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.match(await page.locator('#mode-notice').textContent(), /OFFLINE DEMO/);
  assert.equal(await page.locator('.sidebar').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(0, 0, 0)');
  assert.equal(await page.locator('body').evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()), '#aba346');
  assert.equal(await page.locator('.brand-tagline').textContent(), 'Learn. Teach. Repeat.');
  assert.ok(await page.locator('.brand img').evaluate(node => node.complete && node.naturalWidth > 0));
  await page.screenshot({path:'preview/tcf-study-demo.png',fullPage:true});
  await page.getByRole('button',{name:/EXPLORE A PASSAGE/}).click();
  await page.getByRole('heading',{name:'Abiding in Christ',exact:true}).waitFor();
  await page.getByRole('button',{name:'Read source: John 15:1–8',exact:true}).first().click();
  assert.match(await page.locator('.scripture-text').first().textContent(),/I am the true vine/);
  await page.getByRole('button',{name:'How can I apply this today?',exact:true}).click();
  await page.getByRole('heading',{name:'Abiding in Christ: putting it into practice'}).waitFor();
  await page.locator('.new-study').click(); await page.locator('#welcome:visible').waitFor();
  assert.equal(await page.locator('.turn').count(),0);
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await page.locator('#chat-form').evaluate(node => node.getBoundingClientRect().bottom <= innerHeight));
  assert.ok(await page.locator('#question').evaluate(node => node.getBoundingClientRect().top >= 0));
  await page.locator('#question').fill('What is grace?'); await page.locator('#question').press('Enter');
  await page.getByRole('heading',{name:'Grace: received, then lived'}).waitFor();
  await page.getByRole('button',{name:'Privacy & limitations'}).click();
  assert.match(await page.locator('#dialog-content').textContent(),/stay in this page/);
  assert.deepEqual(errors,[]); assert.deepEqual(network,[]);
  console.log('Offline preview passed: styling, embedded image, passage study, sources, follow-up, reset, mobile, privacy, and zero HTTP requests.');
} finally { await browser.close(); }
