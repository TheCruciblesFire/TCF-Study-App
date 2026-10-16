// Conservative transformation for a *human-reviewed* raw STEPBible column map.
// Never auto-detect original-language columns or silently flatten textual variants.
import { readFileSync, writeFileSync } from 'node:fs';
import { buildVerseLexicon } from '../server/verse-lexicon.js';

const KEYS = ['reference','position','strong','surface','lemma','transliteration','morphology','edition'];
const text = value => typeof value === 'string' && value.length > 0 && !/[\u0000-\u001f]/.test(value);
export function reconcileTaggedRows(tsv, map) {
  if (typeof tsv !== 'string' || !map || map.reviewed !== true ||
      !['TAGNT','TAHOT'].includes(map.dataset) ||
      !/^[0-9a-f]{40}$/.test(map.sourceCommit ?? '') ||
      !/^[0-9a-f]{64}$/.test(map.sourceSha256 ?? '') ||
      !Array.isArray(map.columns) || map.columns.length < 8 ||
      !map.fieldColumns || typeof map.fieldColumns !== 'object' ||
      !Array.isArray(map.allowedEditions) || !map.allowedEditions.length)
    throw Error('Reviewed dataset, pinned commit, source hash, column mapping and edition allowlist required');
  if (map.variantPolicy !== 'explicit-single-edition-per-row') throw Error('Unsupported variant policy: review source first');
  if (new Set(map.columns).size !== map.columns.length || !map.columns.every(text))
    throw Error('Invalid source column names');
  for (const key of KEYS) if (!map.columns.includes(map.fieldColumns[key])) throw Error('Missing reviewed mapping: ' + key);
  const lines = tsv.replace(/^\uFEFF/,'').trimEnd().split(/\r?\n/);
  const headers = lines.shift()?.split('\t') ?? [];
  if (headers.join('\t') !== map.columns.join('\t')) throw Error('Actual source headers differ from reviewed mapping');
  const allow = new Set(map.allowedEditions);
  const rows=[], skipped={};
  for (let i=0;i<lines.length;i++) {
    if (!lines[i].trim()) continue;
    const cells=lines[i].split('\t');
    if (cells.length !== headers.length) throw Error('Column count mismatch on source line ' + (i+2));
    const fields=Object.fromEntries(headers.map((h,j)=>[h,cells[j]]));
    const row=Object.fromEntries(KEYS.map(key=>[key,fields[map.fieldColumns[key]]]));
    row.position=Number(row.position);
    if (!allow.has(row.edition)) throw Error('Unknown/combined textual edition on source line ' + (i+2));
    if (!/^[GH][1-9][0-9]{0,4}$/.test(row.strong)) {
      // Extended Strong IDs and suffixes are not interchangeable with base Strong IDs.
      throw Error('Extended or ambiguous Strong identifier requires explicit mapping on source line ' + (i+2));
    }
    rows.push(row);
  }
  const index=buildVerseLexicon(rows,{dataset:map.dataset,sourceCommit:map.sourceCommit,
    sourceUrl:'https://github.com/STEPBible/STEPBible-Data',license:'CC BY 4.0'});
  index.metadata.sourceSha256=map.sourceSha256;
  index.metadata.variantPolicy=map.variantPolicy;
  index.metadata.reviewedMappingId=map.mappingId ?? '';
  return index;
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const [input, mappingPath, output] = process.argv.slice(2);
  if (!input || !mappingPath || !output) { console.error('Usage: node scripts/reconcile-stepbible-rows.js source.tsv reviewed-map.json output.json'); process.exit(2); }
  const map=JSON.parse(readFileSync(mappingPath,'utf8'));
  const index=reconcileTaggedRows(readFileSync(input,'utf8'),map);
  writeFileSync(output,JSON.stringify(index)+'\n');
  console.log('Validated '+index.count+' tokens with explicit edition metadata');
}
