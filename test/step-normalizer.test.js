import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStepBriefLexicon } from '../scripts/normalize-step-brief.js';
// These representative source rows preserve the eight-column form inspected
// from authentic TBESG/TBESH data. Text is shortened for deterministic tests.
const greek = [
'eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\tMeaning',
'G0001\tG0001G =\tG0001G\tα, Ἀλφα\tAlpha\tG:N-LI\tAlpha\tentry',
'G0001\tG0001H =\tG0001H\tἆ\ta\tG:INJ\tah!\tentry',
'G0026\tG0026 =\tG0026\tἀγάπη\tagapē\tG:N-F\tlove\tentry',
'G3056\tG3056 =\tG3056\tλόγος\tlogos\tG:N-M\tword\tentry',
].join('\n');
const hebrew = [
'eStrong#\tdStrong\tuStrong\tHebrew\tTransliteration\tMorph\tGloss\tMeaning',
'H0001\tH0001G =\tH0001G\tאָב\tav\tH:N-M\tfather\tentry',
'H0001\tH0001H =\tH0001H\tאָב\tav\tH:N-M\tother\tentry',
'H7225\tH7225G =\tH7225G\tרֵאשִׁית\tre.shit\tH:N-F\tbeginning\tentry',
'H7225\tH7225H =\tH7225H\tרֵאשִׁית\tre.shit\tH:N-F\tbest\tentry',
'H0010\tH0010 =\tH0010\tאֲבַדּוֹן\ta.vad.don\tH:N-F\tdestruction\tentry',
].join('\n');
test('real STEP column layout imports unambiguous Greek rows and excludes sense collisions', () => {
  const { normalized, audit } = normalizeStepBriefLexicon(greek,'G');
  assert.match(normalized, /G26\tἀγάπη\tlove/);
  assert.match(normalized, /G3056\tλόγος\tword/);
  assert.doesNotMatch(normalized, /G1\t/);
  assert.equal(audit.excluded,1);
});
test('Hebrew extended senses are never merged into one Strong gloss', () => {
  const {normalized,audit} = normalizeStepBriefLexicon(hebrew,'H');
  assert.match(normalized,/H10\tאֲבַדּוֹן\tdestruction/);
  assert.equal(audit.excluded,2);
  assert.equal(audit.imported,1);
});
test('changed input column layout fails closed', () => {
  assert.throws(()=>normalizeStepBriefLexicon('G0026\tbad','G'),/header/);
});

test('missing lemma is excluded but valid rows remain importable', () => {
  const raw = [
    'eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\tMeaning',
    'G2199\tG2199H =\tG2199H\t\t\tN:N-F-P\t[wife of Zebedee]\tentry',
    'G0026\tG0026 =\tG0026\tἀγάπη\tagapē\tG:N-F\tlove\tentry',
  ].join('\n');
  const { normalized, audit } = normalizeStepBriefLexicon(raw, 'G');
  assert.equal(audit.sourceRecords, 2);
  assert.equal(audit.imported, 1);
  assert.equal(audit.excluded, 1);
  assert.equal(audit.exclusions[0].reason, 'missing lemma');
  assert.match(normalized, /G26\tἀγάπη\tlove/);
});

test('extended STEPBible identifiers are audited rather than crashing base Strong importer', () => {
  const greek = [
    'eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\tMeaning',
    'G6000\tG6000 =\tG6000\tἀγγέλλω\tangellō\tG:V\tto report\tentry',
    'G0026\tG0026 =\tG0026\tἀγάπη\tagapē\tG:N-F\tlove\tentry'
  ].join('\n');
  const result = normalizeStepBriefLexicon(greek, 'G');
  assert.equal(result.audit.sourceRecords, 2);
  assert.equal(result.audit.imported, 1);
  assert.equal(result.audit.excluded, 1);
  assert.equal(result.audit.exclusions[0].id, 'G6000');
  assert.match(result.audit.exclusions[0].reason, /outside supported/);
  assert.match(result.normalized, /G26\tἀγάπη\tlove/);
});
test('Hebrew extended prefix identifiers are reported without defining an invalid Strong record', () => {
  const hebrew = [
    'eStrong#\tdStrong\tuStrong\tHebrew\tTransliteration\tMorph\tGloss\tMeaning',
    'H9001\tH9001 =\tH9001\t\/וַ\tv\tH:Conj\t&\tentry',
    'H0010\tH0010 =\tH0010\tאֲבַדּוֹן\ta.vad.don\tH:N-F\tdestruction\tentry'
  ].join('\n');
  const result = normalizeStepBriefLexicon(hebrew, 'H');
  assert.equal(result.audit.imported, 1);
  assert.equal(result.audit.excluded, 1);
  assert.equal(result.audit.exclusions[0].id, 'H9001');
});
