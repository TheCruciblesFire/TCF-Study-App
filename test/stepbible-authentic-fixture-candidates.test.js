import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {extractAuthenticFixtureCandidates} from '../scripts/export-stepbible-fixture-candidates.js';
import {expectedFiles} from '../scripts/stepbible-source-audit.js';
const commit='a'.repeat(40);
const digest=x=>createHash('sha256').update(x).digest('hex');
const source=(name,ref,word)=>{
 const bytes=Buffer.from('documentation\n'+[ref,word,...Array(15).fill('')].join('\t')+'\n');
 return {bytes,file:{name,sha256:digest(bytes)}};
};
test('candidate Greek source values are preserved but not approved',()=>{
 const {bytes,file}=source(expectedFiles[0],'Mat.1.001=NKO','λόγος');
 const result=extractAuthenticFixtureCandidates(bytes,file,commit);
 assert.equal(result.reviewed,false);
 assert.equal(result.status,'CANDIDATES_UNREVIEWED');
 assert.equal(result.expected[0].columnChecks.length,17);
 assert.equal(result.expected[0].columnChecks[1].value,'λόγος');
 assert.equal(result.expected[0].rawRowSha256,digest(Buffer.from([result.expected[0].reference,'λόγος',...Array(15).fill('')].join('\t'))));
});
test('Hebrew source candidates retain opaque reading markers',()=>{
 const {bytes,file}=source(expectedFiles[2],'Gen.1.001=Q(k)','בְּרֵאשִׁית');
 const result=extractAuthenticFixtureCandidates(bytes,file,commit);
 assert.equal(result.expected[0].reference,'Gen.1.001=Q(k)');
});
test('tampered files and unsupported formats fail closed',()=>{
 const {bytes,file}=source(expectedFiles[0],'Mat.1.001=NKO','text');
 assert.throws(()=>extractAuthenticFixtureCandidates(Buffer.concat([bytes,Buffer.from('x')]),file,commit),/SHA-256/);
 assert.throws(()=>extractAuthenticFixtureCandidates(bytes,{...file,name:'untrusted'},commit),/Pinned/);
 const invalid=Buffer.from('unknown\n');const bad={name:expectedFiles[0],sha256:digest(invalid)};
 assert.throws(()=>extractAuthenticFixtureCandidates(invalid,bad,commit),/No candidate/);
});
