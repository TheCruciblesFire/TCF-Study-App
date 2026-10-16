// Downloads pinned upstream resources into a private local directory and creates a
// manifest consumable by stepbible-source-audit.js. No inferred lexical mappings.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { expectedFiles } from './stepbible-source-audit.js';

export const sourceBase = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/';
export const dataDir = 'Translators Amalgamated OT+NT';

export function buildPinnedSourceUrl(commit, file) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('A pinned 40-hex upstream commit is required');
  if (!expectedFiles.includes(file)) throw Error('Unknown STEPBible source file');
  return sourceBase + commit + '/' + encodeURIComponent(dataDir) + '/' + encodeURIComponent(file);
}

export async function stagePinnedSources(commit, dir, { request = fetch } = {}) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('Pin the exact upstream 40-hex commit');
  if (!dir || typeof dir !== 'string') throw Error('Explicit local output directory required');
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const name of expectedFiles) {
    const response = await request(buildPinnedSourceUrl(commit, name));
    if (!response.ok) throw Error('Upstream download failed for ' + name + ': ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1000 || bytes.length > 100_000_000) throw Error('Unexpected dataset size: ' + name);
    const text = new TextDecoder('utf-8', { fatal:true }).decode(bytes);
    if (!text.includes('\t')) throw Error('File does not contain TSV fields: ' + name);
    const destination = resolve(dir, name);
    if (existsSync(destination)) throw Error('Refusing to overwrite existing source: ' + destination);
    writeFileSync(destination, bytes, { flag:'wx' });
    files.push({ name, localPath:destination, sha256:createHash('sha256').update(bytes).digest('hex') });
  }
  const manifest = { sourceCommit:commit, license:'CC BY 4.0', files };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest,null,2) + '\n', { flag:'wx' });
  return manifest;
}
if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  const [commit, dir] = process.argv.slice(2);
  if (!commit || !dir) { console.error('Usage: node scripts/fetch-stepbible-sources.js <40-hex-commit> <local-directory>'); process.exit(2); }
  await stagePinnedSources(commit,dir);
  console.log('Source snapshot staged. Run node scripts/stepbible-source-audit.js ' + join(dir,'manifest.json') + ' ' + join(dir,'report.json'));
}
