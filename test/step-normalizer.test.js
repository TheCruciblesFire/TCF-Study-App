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

test('source identifier variants do not reject ordinary rows or silently map aliases', () => {
  const greek = [
    'eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\tMeaning',
    'G0001\tG0001G =\tG0001G\tα\tAlpha\tG:N\tAlpha\tentry',
    'G0001\tG0001H =\tG0001H\tἆ\ta\tG:INJ\tah!\tentry',
    'G2495\tG2491K =\tG2491K\tἸωνᾶς\tIōnas\tN:N-M-P\tJohn\tentry',
    'G0026\tG0026 =\tG0026\tἀγάπη\tagapē\tG:N-F\tlove\tentry',
    'G6000\tG6000 =\tG6000\tἀγγέλλω\tangellō\tG:V\tto report\tentry'
  ].join('\n');
  const g = normalizeStepBriefLexicon(greek, 'G');
  assert.equal(g.audit.imported, 1);
  assert.equal(g.audit.excluded, 3);
  assert.match(g.normalized, /G26\tἀγάπη\tlove/);
  const hebrew = [
    'eStrong#\tdStrong\tuStrong\tHebrew\tTransliteration\tMorph\tGloss\tMeaning',
    'H5838\tH5838w = a Name of\tH5818H\tעֲזַרְיָה\ta.zar.yah\tN:N-M-P\tAzariah\tentry',
    'H0010\tH0010 =\tH0010\tאֲבַדּוֹן\ta.vad.don\tH:N-F\tdestruction\tentry'
  ].join('\n');
  const h = normalizeStepBriefLexicon(hebrew, 'H');
  assert.equal(h.audit.imported, 1);
  assert.equal(h.audit.excluded, 1);
});

test('an incomplete extended sense withholds the whole base Strong ID regardless of row order', () => {
  const header = 'eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\tMeaning';
  const valid = 'G2199\tG2199G =\tG2199G\tΖεβεδαῖος\tZebedaios\tN:N-M\tZebedee\tentry';
  const incomplete = 'G2199\tG2199H =\tG2199H\t\t\tN:N-F-P\t[wife of Zebedee]\tentry';
  const safe = 'G0026\tG0026 =\tG0026\tἀγάπη\tagapē\tG:N-F\tlove\tentry';
  for (const order of [[valid, incomplete], [incomplete, valid]]) {
    const { normalized, audit } = normalizeStepBriefLexicon([header, ...order, safe].join('\n'), 'G');
    assert.doesNotMatch(normalized, /G2199\t/);
    assert.match(normalized, /G26\tἀγάπη\tlove/);
    assert.equal(audit.imported, 1);
    assert.equal(audit.sourceRecords, 3);
    assert.equal(audit.excludedSourceRecords, 2);
    assert.equal(audit.sourceRecords, audit.imported + audit.excludedSourceRecords);
    assert.ok(audit.exclusions.some(e => e.id === 'G2199' && /missing lemma/.test(e.reason)));
    assert.ok(audit.exclusions.some(e => e.id === 'G2199' && /withheld/.test(e.reason)));
  }
});

test('aliased row also blocks the related valid base ID', () => {
  const raw = [
    'eStrong#\tdStrong\tuStrong\tHebrew\tTransliteration\tMorph\tGloss\tMeaning',
    'H5838\tH5838w = a Name of\tH5818H\tעֲזַרְיָה\ta.zar.yah\tN:N-M-P\tAzariah\tentry',
    'H5838\tH5838 =\tH5838\tעֲזַרְיָה\ta.zar.yah\tH:N-M\tAzariah\tentry',
    'H0010\tH0010 =\tH0010\tאֲבַדּוֹן\ta.vad.don\tH:N-F\tdestruction\tentry'
  ].join('\n');
  const { normalized, audit } = normalizeStepBriefLexicon(raw, 'H');
  assert.doesNotMatch(normalized, /H5838\t/);
  assert.equal(audit.imported, 1);
  assert.equal(audit.excludedSourceRecords, 2);
  assert.equal(audit.sourceRecords, audit.imported + audit.excludedSourceRecords);
});
