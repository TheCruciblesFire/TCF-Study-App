import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { normalizeStepBriefLexicon } from './normalize-step-brief.js';
import { importLexicon } from './import-step-lexicon.js';

// Offline, immutable Git blob input. Neither this tool nor the production
// chatbot downloads any data. Supply reviewed upstream files from GitHub.
export function buildFullLexicon(raw, { language, blobSha, commit, sourceUrl }) {
  const bytes = Buffer.from(raw, 'utf8');
  const actualBlob = createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
  if (blobSha !== actualBlob || !/^[a-f0-9]{40}$/.test(commit)) throw Error('Upstream source identity not verified');
  const { normalized, audit } = normalizeStepBriefLexicon(raw, language);
  const manifest = {
    sourceUrl, commit, normalizedSha256: createHash('sha256').update(normalized).digest('hex'), license: 'CC BY 4.0'
  };
  const index = importLexicon(normalized, manifest);
  if (Object.keys(index.entries).length !== audit.imported ||
      audit.sourceRecords !== audit.imported + audit.excludedSourceRecords || !audit.reconciled) {
    throw Error('Audit count mismatch');
  }
  for (const [id, expected] of Object.entries(language === 'G'
    ? { G26: ['ἀγάπη', 'love'], G3056: ['λόγος', 'word'] }
    : { H10: ['אֲבַדּוֹן', 'destruction'] })) {
    if (index.entries[id] && (!index.entries[id].lemma.includes(expected[0]) || !index.entries[id].gloss.includes(expected[1]))) throw Error(`Representative review failed: ${id}`);
  }
  return { index, audit: { ...audit, blobSha, commit, normalizedSha256: manifest.normalizedSha256, sourceUrl, license: 'CC BY 4.0', attribution: 'STEP Bible https://www.stepbible.org/', changes: 'Only unambiguous base Strong IDs; extended-sense collisions excluded.' } };
}
if (process.argv[1]?.endsWith('/build-full-step.js')) {
  const [rawPath, metaPath, outputPrefix] = process.argv.slice(2);
  if (!rawPath || !metaPath || !outputPrefix) throw Error('Usage: node scripts/build-full-step.js UPSTREAM.txt SOURCE.json OUTPUT_PREFIX');
  const result = buildFullLexicon(readFileSync(rawPath, 'utf8'), JSON.parse(readFileSync(metaPath, 'utf8')));
  mkdirSync(dirname(outputPrefix), { recursive: true });
  writeFileSync(outputPrefix + '.json', JSON.stringify(result.index) + '\n', { flag: 'wx' });
  writeFileSync(outputPrefix + '.audit.json', JSON.stringify(result.audit, null, 2) + '\n', { flag: 'wx' });
  console.log(`Imported ${result.audit.imported} entries; excluded ${result.audit.excludedSourceRecords} source rows across ${result.audit.excluded} audit items; reconciled ${result.audit.sourceRecords} total source rows`);
}
