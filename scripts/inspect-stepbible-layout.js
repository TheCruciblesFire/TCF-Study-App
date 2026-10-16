// Inspect source column shapes without pretending the fields are reconciled.
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

export function describeSourceLayout(raw, { sample = 1000 } = {}) {
  if (typeof raw !== 'string') throw Error('Expected decoded UTF-8');
  const lines = raw.replace(/^\uFEFF/,'').split(/\r?\n/);
  const fieldCounts = {}, prefixes = {}, examples = [];
  let comments=0, nonEmpty=0, tabs=0;
  for (const line of lines) {
    if (!line.trim()) continue;
    nonEmpty++;
    if (/^\s*(?:#|\/\/|\$)/.test(line)) { comments++; continue; }
    if (!line.includes('\t')) continue;
    tabs++;
    const cells = line.split('\t');
    fieldCounts[cells.length] = (fieldCounts[cells.length] ?? 0) + 1;
    const first = cells[0]?.trim() ?? '';
    const pattern = first.replace(/[0-9]+/g,'#').slice(0,36);
    prefixes[pattern] = (prefixes[pattern] ?? 0) + 1;
    if (examples.length < 12 && examples.every(e=>e.fieldCount !== cells.length)) {
      examples.push({ line:nonEmpty,fieldCount:cells.length,firstColumn:first.slice(0,60),
        // Only the *shape* of other fields, not Scripture / copyrighted content.
        otherFieldLengths:cells.slice(1,12).map(c=>c.length) });
    }
  }
  return { nonEmpty,commentLines:comments,tabLines:tabs,fieldCounts,firstColumnPatterns:Object.entries(prefixes).sort((a,b)=>b[1]-a[1]).slice(0,30),examples,
    status:'FORMAT_INSPECTION_ONLY',warning:'Do not treat columns as semantic mappings, normalized verses, or licensed translation alignment.' };
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
 const [input,output] = process.argv.slice(2);
 if (!input || !output) { console.error('Usage: node scripts/inspect-stepbible-layout.js input.txt report.json'); process.exit(2); }
 const report=describeSourceLayout(new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(input)));
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');
}
