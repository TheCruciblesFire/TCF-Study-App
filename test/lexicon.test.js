import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStrongId, validateLexiconEntry } from '../server/lexicon.js';

test('Strong identifiers normalize only bounded Hebrew and Greek IDs', () => {
  assert.equal(parseStrongId('g26'), 'G26');
  assert.equal(parseStrongId(' H7225 '), 'H7225');
  for (const input of ['G0', 'H0', 'G9999', 'H9999', 'G1;DROP', 'G-26', 'G00026', 'Gabc', 'H8675', 'G5625', '', null]) {
    assert.equal(parseStrongId(input), null, String(input));
  }
});
test('lexical records require matching IDs and transparent provenance', () => {
  const sample = { id: 'G26', lemma: 'sample lemma', gloss: 'sample gloss', source: 'Example source', license: 'Example license' };
  assert.deepEqual(validateLexiconEntry(sample, 'G26'), sample);
  assert.equal(validateLexiconEntry({ ...sample, id: 'G27' }, 'G26'), null);
  assert.equal(validateLexiconEntry({ ...sample, source: '' }, 'G26'), null);
  assert.equal(validateLexiconEntry({ ...sample, gloss: '' }, 'G26'), null);
});
