import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLiveProviders, WEB_BIBLE_ID } from '../server/providers.js';

test('observation feedback refuses a stored CSB passage before an AI request', async () => {
  let called = false;
  const providers = createLiveProviders({ BIBLE_ID: WEB_BIBLE_ID }, async () => { called = true; throw Error('Unexpected provider call'); });
  const source = { bibleId: 'licensed-csb', translation: 'CSB', copyright: 'Copyright holder',
    reference: 'John 15:1–8', text: 'LICENSED_TEXT_SENTINEL' };
  await assert.rejects(() => providers.observationFeedback(source, 'A careful learner reflection',
    { cost: 0, input: 0, output: 0 }), error => error.code === 'WEB_REQUIRED');
  assert.equal(called, false);
});
