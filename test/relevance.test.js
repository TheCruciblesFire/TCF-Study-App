import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessSupportingSource, selectSupportingSources } from '../server/relevance.js';

test('identical retrieved source texts are not presented as independent evidence', () => {
  const main = { reference: 'John 15:1–8', text: 'Abide in me and bear fruit' };
  const candidates = [
    { reference: 'John 15:4–8', text: 'Abide in me and bear fruit' },
    { reference: 'Galatians 5:22–23', text: 'Fruit of the Spirit is love and joy' },
    { reference: 'Other', text: 'Fruit of the Spirit is love and joy' },
  ];
  assert.deepEqual(selectSupportingSources(main, candidates).map(s => s.reference), ['Galatians 5:22–23']);
  assert.equal(assessSupportingSource(main, candidates[0]).status, 'duplicate_text');
  assert.equal(assessSupportingSource(main, candidates[1]).status, 'lexical_parallel');
});

test('lexical gaps are not mistaken for proof of biblical irrelevance', () => {
  const a = { text: 'The shepherd guides the sheep' };
  const b = { text: 'The Messiah lays down his life' };
  assert.equal(assessSupportingSource(a, b).status, 'requires_interpretive_review');
  assert.equal(selectSupportingSources(a, [{ reference: 'John 10:11', ...b }]).length, 1);
});
