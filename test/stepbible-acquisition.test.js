import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stagePinnedSources, buildPinnedSourceUrl } from '../scripts/fetch-stepbible-sources.js';
import { describeSourceLayout } from '../scripts/inspect-stepbible-layout.js';
import { expectedFiles, auditSources } from '../scripts/stepbible-source-audit.js';

test('pins URLs, stages actual bytes and passes independent SHA audit', async () => {
 const commit='b'.repeat(40), dir=mkdtempSync(join(tmpdir(),'stepbible-stage-'));
 try {
  const requested=[];
  const mock=async url => {requested.push(url);return {ok:true,arrayBuffer:async()=>Buffer.from('ref\tform\tlemma\n'.repeat(100)).buffer.slice(Buffer.from('ref\tform\tlemma\n'.repeat(100)).byteOffset,Buffer.from('ref\tform\tlemma\n'.repeat(100)).byteOffset+Buffer.from('ref\tform\tlemma\n'.repeat(100)).length)};};
  // Using Uint8Array bytes avoids any claim about upstream source column layout.
  const sample=new TextEncoder().encode('ref\tform\tlemma\n'.repeat(100));
  const manifest=await stagePinnedSources(commit,dir,{request:async url=>{requested.push(url);return {ok:true,arrayBuffer:async()=>sample.buffer};}});
  assert.equal(manifest.files.length,6);
  assert.equal(requested.length,6);
  assert.ok(requested.every(u=>u.includes(commit)));
  assert.equal(auditSources(manifest).status,'HASH_VERIFIED_ONLY');
  assert.equal(readFileSync(join(dir,'manifest.json'),'utf8').includes('sha256'),true);
  await assert.rejects(()=>stagePinnedSources(commit,dir,{request:async()=>({ok:true,arrayBuffer:async()=>sample.buffer})}),/overwrite/);
 } finally {rmSync(dir,{recursive:true,force:true})}
});
test('rejects mutable refs and unknown file URLs', () => {
 assert.throws(()=>buildPinnedSourceUrl('main',expectedFiles[0]),/pinned/);
 assert.throws(()=>buildPinnedSourceUrl('c'.repeat(40),'not-a-source'),/Unknown/);
});
test('inspects field shapes, without emitting source content', () => {
 const r=describeSourceLayout('Header\nMat.1.1\tGreek\tTAG\nMat.1.2\tword\tTAG\n');
 assert.equal(r.tabLines,2); assert.equal(r.fieldCounts[3],2);
 assert.equal(r.status,'FORMAT_INSPECTION_ONLY');
});
