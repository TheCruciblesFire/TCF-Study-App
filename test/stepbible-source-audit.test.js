import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { auditSources, expectedFiles } from '../scripts/stepbible-source-audit.js';

test('verifies six pinned source files and records structural counts without semantic claims', () => {
 const dir = mkdtempSync(join(tmpdir(),'tcf-step-'));
 try {
  const files=expectedFiles.map((name,i)=>{
    const localPath=join(dir,String(i)+'.txt'),raw=Buffer.from('header\tfield\nverse\ttoken\n');
    writeFileSync(localPath,raw);
    return {name,localPath,sha256:createHash('sha256').update(raw).digest('hex')};
  });
  const manifest={sourceCommit:'a'.repeat(40),license:'CC BY 4.0',files};
  const report=auditSources(manifest);
  assert.equal(report.files.length,6);
  assert.equal(report.status,'HASH_VERIFIED_ONLY');
  assert.equal(report.files[0].tabDelimitedLines,2);
  assert.throws(()=>auditSources({...manifest,files:[...files.slice(0,5),{...files[5],sha256:'0'.repeat(64)}]}),/mismatch/);
  assert.throws(()=>auditSources({...manifest,files:files.slice(0,5)}),/six/);
  assert.throws(()=>auditSources({...manifest,sourceCommit:'master'}),/Pinned/);
 } finally {rmSync(dir,{recursive:true,force:true})}
});
