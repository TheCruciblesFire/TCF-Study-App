// Offline, reproducible source staging. No network or speculative field mapping.
// node scripts/stepbible-source-audit.js manifest.json report.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

export const expectedFiles = Object.freeze([
  'TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt',
  'TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt',
  'TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
  'TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
  'TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
  'TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt',
]);

export function auditSources(manifest) {
  if (!manifest || manifest.license !== 'CC BY 4.0' ||
      !/^[0-9a-f]{40}$/.test(manifest.sourceCommit ?? '') ||
      !Array.isArray(manifest.files) || manifest.files.length !== expectedFiles.length)
    throw Error('Pinned commit, CC BY 4.0 and all six file records are required');
  const names = new Set(), results = [];
  for (const file of manifest.files) {
    if (!expectedFiles.includes(file.name) || names.has(file.name)) throw Error('Unexpected or duplicate source file');
    names.add(file.name);
    if (!/^[0-9a-f]{64}$/.test(file.sha256 ?? '')) throw Error('A real SHA-256 checksum is required for ' + file.name);
    if (typeof file.localPath !== 'string' || !file.localPath.trim()) throw Error('Local path required');
    const raw = readFileSync(file.localPath);
    const actual = createHash('sha256').update(raw).digest('hex');
    if (actual !== file.sha256) throw Error('SHA-256 mismatch: ' + file.name);
    const content = raw.toString('utf8').replace(/^\uFEFF/, '');
    if (content.includes('\uFFFD')) throw Error('Invalid UTF-8 decode: ' + file.name);
    const lines = content.split(/\r?\n/);
    const tabbed = lines.filter(line => line.includes('\t'));
    if (!tabbed.length) throw Error('No TSV records: ' + file.name);
    const prefixes = Object.create(null);
    for (const line of lines.slice(0, 120)) {
      const first = line.split('\t',1)[0].slice(0,40);
      if (!first) continue;
      prefixes[first] = (prefixes[first] ?? 0) + 1;
    }
    results.push({ name:file.name,bytes:raw.length,sha256:actual,
      lines:lines.length,tabDelimitedLines:tabbed.length,
      sampleFieldCounts:tabbed.slice(0,30).map(line=>line.split('\t').length),
      // Structural overview, not raw content: avoids exporting copyrighted Scripture by accident.
      firstColumnPatterns:Object.entries(prefixes).slice(0,25) });
  }
  return { sourceCommit:manifest.sourceCommit,source:'https://github.com/STEPBible/STEPBible-Data',
    license:'CC BY 4.0',attribution:'STEP Bible (STEPBible.org)',files:results,
    status:'HASH_VERIFIED_ONLY', warning:'Structural audit does not constitute TAGNT/TAHOT field mapping, edition reconciliation, or verse alignment.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [input,output] = process.argv.slice(2);
  if (!input || !output) { console.error('Usage: node scripts/stepbible-source-audit.js manifest.json report.json'); process.exit(2); }
  const report = auditSources(JSON.parse(readFileSync(input,'utf8')));
  writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log('Hash-verified '+report.files.length+' STEPBible datasets at '+report.sourceCommit);
}
