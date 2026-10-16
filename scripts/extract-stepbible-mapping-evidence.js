// Phase 9A: gather redacted evidence from *candidate token rows*, never
// infer semantic mappings or publish original-language words.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const LIMIT = 24;
const reference = /^(?:[1-3]?[A-Za-z]{2,5})\.\d{1,3}\.[^\t=]{1,32}=[A-Za-z()0-9,+-]+$/;
const heading = /^(?:Eng \(Heb\) Ref & Type|Word & Type|[\w /()&+-]*Ref(?:erence)?[\w /()&+-]*)$/i;
const describe = s => s.replace(/[\p{L}\p{M}]+/gu, 'A').replace(/\d+/g, '#').slice(0, 75);

export function extractMappingEvidence(raw, dataset) {
  if (!['TAGNT','TAHOT'].includes(dataset)) throw Error('Expected TAGNT or TAHOT');
  if (typeof raw !== 'string' || raw.includes('\uFFFD')) throw Error('Invalid UTF-8 source');
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
  const counts = {tokenCandidates:0, columnHeadings:0, variantMarkers:0, annotations:0, documentation:0, blank:0};
  const headings = [], tokenShapes = new Map(), variants = new Map(), rejectedExamples = [];
  for (let i=0; i<lines.length; i++) {
    const line=lines[i], cells=line.split('\t'), first=(cells[0] ?? '').trim();
    if (!line.trim()) {counts.blank++;continue;}
    if (/^#_Significant variant\b/.test(first)) {
      counts.variantMarkers++;
      const key=String(cells.length);
      variants.set(key,(variants.get(key) ?? 0)+1);
      continue;
    }
    if (heading.test(first)) {
      counts.columnHeadings++;
      if (headings.length<LIMIT) headings.push({line:i+1,columnCount:cells.length,
        labels:cells.map((c,j)=>({column:j+1,label:c.trim().slice(0,100)})).filter(x=>x.label)});
      continue;
    }
    if (reference.test(first) && cells.length>=8) {
      counts.tokenCandidates++;
      const signature=cells.length+':'+describe(first)+':'+cells.map(c=>c.trim()?'1':'0').join('');
      if (!tokenShapes.has(signature) && tokenShapes.size<LIMIT) tokenShapes.set(signature,{
        line:i+1,columnCount:cells.length,firstColumnPattern:describe(first),
        occupiedColumns:cells.map((c,j)=>c.trim()?j+1:null).filter(Boolean),
        columnLengths:cells.map(c=>c.length)});
      continue;
    }
    if (/^\s*(?:#|\/\/|\$)/.test(first)) counts.annotations++;
    else counts.documentation++;
    if (rejectedExamples.length<12) rejectedExamples.push({line:i+1,columnCount:cells.length,firstColumnPattern:describe(first)});
  }
  return {dataset,counts,columnHeadingCandidates:headings,tokenRowShapes:[...tokenShapes.values()],
    variantMarkerColumnCounts:Object.fromEntries(variants),rejectedRowShapes:rejectedExamples,
    mappingReviewed:false,warning:'Candidate rows and headings only. No verified column semantics, Strong mapping, textual edition reconciliation, morphology or verse alignment.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 const [file,dataset,output]=process.argv.slice(2);
 if (!file||!dataset||!output) throw Error('Usage: node scripts/extract-stepbible-mapping-evidence.js INPUT.txt TAGNT|TAHOT OUTPUT.json');
 const raw=new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(file));
 writeFileSync(output,JSON.stringify(extractMappingEvidence(raw,dataset),null,2)+'\n');
}
