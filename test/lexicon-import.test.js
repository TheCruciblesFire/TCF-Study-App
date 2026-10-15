import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { importLexicon } from '../scripts/import-step-lexicon.js';
const input = 'id\tlemma\tgloss\nG26\tagape\tlove\nH7225\treshith\tbeginning\n';
const manifest = { sourceUrl: 'https://github.com/STEPBible/STEPBible-Data/blob/master/Lexicons/TBESG', commit: 'a'.repeat(40), normalizedSha256: createHash('sha256').update(input).digest('hex'), license: 'CC BY 4.0' };
test('offline lexical importer pins bytes and preserves source attribution', () => {
  const result = importLexicon(input, manifest);
  assert.equal(result.entries.G26.gloss, 'love');
  assert.match(result.metadata.attribution, /STEP Bible/);
  assert.equal(Object.keys(result.entries).length, 2);
  assert.throws(() => importLexicon(input + 'G27\tother\tother\n', manifest), /SHA256/);
  assert.throws(() => importLexicon(input, { ...manifest, license: 'unknown' }), /Pinned source/);
});
test('reject malformed, missing and duplicate reviewed lexical rows', () => {
  for (const bad of ['id\tlemma\tgloss\nG26\ta\tb\nG26\tx\ty\n', 'id\tlemma\tgloss\nG0\ta\tb\n', 'id\tlemma\tgloss\nG26\t\tb\n', 'wrong\tcolumns\nG26\ta\tb\n']) {
    const m = { ...manifest, normalizedSha256: createHash('sha256').update(bad).digest('hex') };
    assert.throws(() => importLexicon(bad, m));
  }
});
