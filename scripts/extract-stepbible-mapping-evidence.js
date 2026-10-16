// Phase 9A evidence gate: capture source-defined column headers and redacted
// row shapes without pretending a field's meaning has been reviewed.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_HEADER = 48;
const MAX_SHAPES = 16;
export function extractMappingEvidence(raw, dataset) {
  if (!['TAGNT', 'TAHOT'].includes(dataset)) throw Error('Expected TAGNT or TAHOT');
  if (typeof raw !== 'string' || raw.includes('\uFFFD')) throw Error('Invalid UTF-8 source');
  const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
  const headers = [];
  const shapes = new Map();
  let dataRows = 0;
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const line = lines[lineNumber];
    if (!line.trim()) continue;
    const cells = line.split('\t');
    // Preserve descriptive header lines only, never source word/token contents.
    // Human review of column meaning must still happen against the pinned sources.
    if (/^\s*(?:#|\/\/|\$)/.test(line)) {
      if (headers.length < MAX_HEADER && /(?:column|field|strong|morph|lemma|variant|ketiv|qere|edition|translit|reference)/i.test(line))
        headers.push({ line: lineNumber + 1, text: line.slice(0, 240) });
      continue;
    }
    if (cells.length < 8 || !line.includes('\t')) continue;
    dataRows++;
    const reference = cells[0]?.trim() ?? '';
    // The first-column label is a *shape*, not an asserted verse reference.
    const pattern = reference.replace(/[0-9]+/g, '#').replace(/[A-Za-z\u0590-\u05ff\u0370-\u03ff]+/g, 'A').slice(0, 60);
    const key = cells.length + ':' + pattern;
    if (!shapes.has(key) && shapes.size < MAX_SHAPES) {
      shapes.set(key, { line: lineNumber + 1, columnCount: cells.length,
        firstColumnPattern: pattern, nonEmptyColumns: cells.map((c,i) => c.trim() ? i+1 : null).filter(Boolean),
        columnLengths: cells.map(c => c.length) });
    }
  }
  return { dataset, headerCandidates: headers, representativeShapes: [...shapes.values()],
    inspectedDataRows: dataRows, mappingReviewed: false,
    warning: 'Structural evidence only. Do not infer field semantics, Strong IDs, morphology, textual edition, or verse alignment.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [file, dataset, output] = process.argv.slice(2);
  if (!file || !dataset || !output) throw Error('Usage: node scripts/extract-stepbible-mapping-evidence.js INPUT.txt TAGNT|TAHOT OUTPUT.json');
  const raw = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(file));
  writeFileSync(output, JSON.stringify(extractMappingEvidence(raw, dataset), null, 2) + '\n');
}
