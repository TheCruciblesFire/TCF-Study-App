import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lookupStrong, loadLexicalIndexes } from '../server/strong-lookup.js';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const meta = { sourceUrl: 'https://github.com/STEPBible/STEPBible-Data/blob/abc/Lexicons/example', attribution: 'STEP Bible', license: 'CC BY 4.0' };
const fake = (language, id) => ({
 metadata: meta, entries: { [id]: { id, lemma: language === 'G' ? 'ἀγάπη' : 'אֲבַדּוֹן', gloss: language === 'G' ? 'love' : 'destruction', source: meta.sourceUrl, license: meta.license } }
});
test('read-only lookup distinguishes found, omitted and invalid Strong identifiers', () => {
 const db = { G: fake('G','G26'), H: fake('H','H10') };
 assert.equal(lookupStrong(db,'g026').lemma, 'ἀγάπη');
 assert.equal(lookupStrong(db,'H10').gloss, 'destruction');
 assert.equal(lookupStrong(db,'G2199').available,false);
 assert.equal(lookupStrong(db,'G6000').error,'INVALID_STRONG');
 assert.equal(lookupStrong(null,'G26').error,'LEXICON_UNAVAILABLE');
});
test('optional loader validates both lexical indexes and reconciled audit files', () => {
 const dir = mkdtempSync(join(tmpdir(),'tcf-strong-'));
 try {
  for (const [language,id] of [['G','G26'],['H','H10']]) {
   writeFileSync(join(dir,language+'.json'),JSON.stringify(fake(language,id)));
   writeFileSync(join(dir,language+'.audit.json'),JSON.stringify({ language, reconciled:true, imported:1, sourceRecords:2, excludedSourceRecords:1 }));
  }
  assert.equal(loadLexicalIndexes(dir).G.entries.G26.gloss,'love');
  writeFileSync(join(dir,'H.audit.json'),JSON.stringify({ language:'H', reconciled:false, imported:1, sourceRecords:2, excludedSourceRecords:1 }));
  assert.throws(()=>loadLexicalIndexes(dir),/integrity/);
 } finally { rmSync(dir,{recursive:true,force:true}); }
});
