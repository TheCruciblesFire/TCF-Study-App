import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { parseStrongId, validateLexiconEntry } from '../server/lexicon.js';

// Offline import of a REVIEWED, normalized TSV export from STEPBible.
// Deliberately does not guess upstream column mappings, meaning-in-context,
// or English-to-Greek/Hebrew alignment.
export function importLexicon(tsv, manifest) {
  if (!manifest || manifest.license !== 'CC BY 4.0' ||
      !/^https:\/\/github\.com\/STEPBible\/STEPBible-Data\//.test(manifest.sourceUrl ?? '') ||
      !/^[0-9a-f]{64}$/.test(manifest.normalizedSha256 ?? '') ||
      !/^[0-9a-f]{40}$/.test(manifest.commit ?? '')) throw Error('Pinned source, commit and license required');
  const input = Buffer.from(tsv, 'utf8');
  const hash = createHash('sha256').update(input).digest('hex');
  if (hash !== manifest.normalizedSha256) throw Error('Normalized export bytes do not match pinned SHA256');
  const lines = tsv.replace(/^\uFEFF/, '').split(/\r?\n/);
  const header = lines.shift();
  if (header !== 'id\tlemma\tgloss') throw Error('Expected reviewed normalized TSV header id, lemma, gloss');
  const rows = Object.create(null);
  for (const [index, line] of lines.entries()) {
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length !== 3) throw Error(`Malformed row ${index + 2}`);
    const id = parseStrongId(parts[0]);
    if (!id || id !== parts[0]) throw Error(`Invalid Strong ID on row ${index + 2}`);
    const entry = validateLexiconEntry({ id, lemma: parts[1], gloss: parts[2], source: manifest.sourceUrl, license: manifest.license }, id);
    if (!entry || entry.lemma.length > 160 || entry.gloss.length > 1200) throw Error(`Invalid lexical entry on row ${index + 2}`);
    if (rows[id]) throw Error(`Duplicate Strong ID ${id}`);
    rows[id] = entry;
  }
  if (!Object.keys(rows).length || Object.keys(rows).length > 16000) throw Error('Unexpected entry count');
  return { metadata: { sourceUrl: manifest.sourceUrl, commit: manifest.commit, normalizedSha256: manifest.normalizedSha256, license: manifest.license, attribution: 'STEP Bible — https://www.stepbible.org/', modified: true, note: 'Normalized export; review differences and retain source notices.' }, entries: rows };
}
if (process.argv[1]?.endsWith('/import-step-lexicon.js')) {
  const [inputPath, manifestPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !manifestPath || !outputPath) throw Error('Usage: node scripts/import-step-lexicon.js INPUT.tsv MANIFEST.json OUTPUT.json');
  const result = importLexicon(readFileSync(inputPath, 'utf8'), JSON.parse(readFileSync(manifestPath, 'utf8')));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log(`Imported ${Object.keys(result.entries).length} pinned, attributed records`);
}
