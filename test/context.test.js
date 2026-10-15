import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseContextReference } from '../server/context.js';

test('bounded same-chapter context preserves primary and source limits', () => {
  assert.equal(chooseContextReference('John 15:4–8', ['John 15:4–8']), 'John 15:2–3');
  assert.equal(chooseContextReference('John 15:3–8', ['John 15:3–8']), 'John 15:1–2');
  assert.equal(chooseContextReference('Romans 8:18–30', ['Romans 8:18–30']), 'Romans 8:16–17');
  assert.equal(chooseContextReference('John 15:1–8', ['John 15:1–8']), null);
  assert.equal(chooseContextReference('Psalm 23', ['Psalm 23']), null);
  assert.equal(chooseContextReference('Romans 8:1–30', ['Romans 8:1–30']), null);
  assert.equal(chooseContextReference('John 15:4–8', ['John 15:4–8', 'John 14:21', 'Galatians 5:22–23']), null);
  assert.equal(chooseContextReference('John 15:4–8', ['John 15:4–8', 'John 15:2–3']), null);
  assert.equal(chooseContextReference('John 15:4–8', ['John 15:4–8', 'John 15:1–2']), null);
  assert.equal(chooseContextReference('John 15:4–8', ['John 15:4–8', 'Galatians 5:22–23']), 'John 15:2–3');
  assert.equal(chooseContextReference('not a passage', ['not a passage']), null);
});
