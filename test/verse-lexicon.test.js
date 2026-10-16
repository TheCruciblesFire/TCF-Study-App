import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildVerseLexicon, getVerseTokens, validateVerseToken } from '../server/verse-lexicon.js';

const meta = dataset => ({dataset,license:'CC BY 4.0',sourceUrl:'https://github.com/STEPBible/STEPBible-Data',sourceCommit:'a'.repeat(40)});
const row = { reference:'Jhn.15.4',position:3,strong:'G3306',surface:'μένω',lemma:'μένω',transliteration:'menō',morphology:'V-PAI',edition:'SBL' };
test('validates a verified Greek verse occurrence', () => {
 const idx=buildVerseLexicon([row],meta('TAGNT'));
 assert.equal(getVerseTokens(idx,'Jhn.15.4','SBL')[0].strong,'G3306');
 assert.deepEqual(getVerseTokens(idx,'Jhn.15.4','TR'),[]);
});
test('does not confuse Greek and Hebrew books, guesses, or unattested IDs', () => {
 assert.equal(validateVerseToken({...row,reference:'Gen.1.1'}),null);
 assert.equal(validateVerseToken({...row,strong:'G99999'}),null);
 assert.equal(validateVerseToken({...row,reference:'John.15.4'}),null);
 assert.equal(validateVerseToken({...row,position:0}),null);
 assert.equal(validateVerseToken({...row,morphology:'<script>'}),null);
});
test('rejects conflicting positions within one textual edition', () => {
 assert.throws(()=>buildVerseLexicon([row,row],meta('TAGNT')),/Duplicate/);
 assert.doesNotThrow(()=>buildVerseLexicon([row,{...row,edition:'TR'}],meta('TAGNT')));
});
test('rejects unverified provenance and incompatible corpus', () => {
 assert.throws(()=>buildVerseLexicon([row],{...meta('TAGNT'),sourceCommit:'latest'}));
 assert.throws(()=>buildVerseLexicon([row],meta('TAHOT')),/Wrong dataset/);
});
test('validates a Hebrew verse independently', () => {
 const hebrew={...row,reference:'Gen.1.1',strong:'H7225',surface:'בְּרֵאשִׁית',lemma:'רֵאשִׁית',transliteration:'rēʾšît',morphology:'N-fs',edition:'WLC'};
 const idx=buildVerseLexicon([hebrew],meta('TAHOT'));
 assert.equal(getVerseTokens(idx,'Gen.1.1','WLC')[0].strong,'H7225');
});
