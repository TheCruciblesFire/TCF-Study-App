import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLiveProviders } from '../server/providers.js';

test('Application AI feedback is unavailable in reference-only live mode', () => {
  const providers = createLiveProviders({});
  assert.equal(providers.applicationFeedback, undefined);
});
