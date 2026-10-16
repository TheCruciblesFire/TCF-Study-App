// Import *reviewed* TAGNT/TAHOT columns after source-format and textual-edition reconciliation.
// Usage: node scripts/normalize-verse-tokens.js reviewed.tsv TAGNT <40-hex-source-commit> output.json
// This tool deliberately rejects direct raw STEPBible files until their edition/tag columns
// have been explicitly mapped; it must never infer verse associations from English glosses.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildVerseLexicon } from '../server/verse-lexicon.js';

const [input, dataset, sourceCommit, output] = process.argv.slice(2);
if (!input || !dataset || !sourceCommit || !output) {
  console.error('Usage: node scripts/normalize-verse-tokens.js reviewed.tsv TAGNT|TAHOT sourceCommit output.json');
  process.exit(2);
}
const lines = readFileSync(input, 'utf8').replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
const header = lines.shift().split('\t');
const expected = ['reference','position','strong','surface','lemma','transliteration','morphology','edition'];
if (header.join('|') !== expected.join('|')) throw Error('Expected reviewed TSV columns: ' + expected.join(', '));
const rows = lines.filter(Boolean).map((line, i) => {
  const cells = line.split('\t');
  if (cells.length !== expected.length) throw Error('Invalid field count at row ' + (i+2));
  return Object.fromEntries(expected.map((key,j) => [key,key === 'position' ? Number(cells[j]) : cells[j]]));
});
const index = buildVerseLexicon(rows, {
  dataset, sourceCommit,
  license:'CC BY 4.0',
  sourceUrl:'https://github.com/STEPBible/STEPBible-Data'
});
writeFileSync(output, JSON.stringify(index) + '\n');
console.log('Validated ' + index.count + ' verse tokens in ' + Object.keys(index.entries).length + ' verses');
