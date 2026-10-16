import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildFullLexicon } from './build-full-step.js';

// Build from upstream blobs pinned and independently checked by Git object SHA.
const [upstream, destination] = process.argv.slice(2);
if (!upstream || !destination) throw Error('Usage: node scripts/build-deployment-lexicon.js UPSTREAM_DIR OUTPUT_DIR');
const commit = execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
mkdirSync(destination, { recursive: true });
for (const [language, file, expectedBlob] of [
  ['G', 'TBESG - Translators Brief lexicon of Extended Strongs for Greek - STEPBible.org CC BY.txt', 'efe271a1dbb73fa01f8fa6e0f164c6687757a9ae'],
  ['H', 'TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt', 'a64990a674d13245ae1e9ed426bc69197c2fbad5']
]) {
  const upstreamPath = 'Lexicons/' + file;
  const actualBlob = execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD:' + upstreamPath], { encoding: 'utf8' }).trim();
  if (actualBlob !== expectedBlob) throw Error('Unreviewed upstream ' + language + ' blob; refusing deployment');
  const sourceUrl = 'https://github.com/STEPBible/STEPBible-Data/blob/' + commit + '/' + encodeURIComponent(upstreamPath).replaceAll('%2F', '/');
  const { index, audit } = buildFullLexicon(readFileSync(join(upstream, upstreamPath), 'utf8'), {
    language, blobSha: actualBlob, commit, sourceUrl
  });
  if (!audit.reconciled || audit.imported < 1000 ||
      audit.sourceRecords !== audit.imported + audit.excludedSourceRecords) {
    throw Error('Incomplete ' + language + ' lexical audit');
  }
  writeFileSync(join(destination, language + '.json'), JSON.stringify(index));
  writeFileSync(join(destination, language + '.audit.json'), JSON.stringify(audit, null, 2));
  console.log(language + ': imported ' + audit.imported + ', audited ' + audit.excludedSourceRecords + ' exclusions');
}
