import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {collectFixtureCandidates} from '../scripts/collect-stepbible-fixture-candidates.js';
import {expectedFiles} from '../scripts/stepbible-source-audit.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
const line=(first,value)=>[first,value,...Array(15).fill('')].join('\t');
test('bounded Greek review rows preserve all raw column values and provenance',()=>{
 const raw=[line('Word & Type','Greek'),line('Mat.1.001=NKO','λόγος'),line('Mat.1.002=NKO','δε'),line('Mat.1.003=NKO','x')].join('\n');
 const bytes=Buffer.from(raw);
 const m={name:expectedFiles[0],sha256:sha(bytes),sourceCommit:'a'.repeat(40)};
 const r=collectFixtureCandidates(bytes,m,{perTarget:2});
 assert.equal(r.candidateCount,2);
 assert.equal(r.reviewed,false);
 assert.equal(r.rows[0].columns.length,17);
 assert.equal(r.rows[0].columns[1].value,'λόγος');
 assert.equal(r.rows[0].rawRowSha256,sha(line('Mat.1.001=NKO','λόγος')));
});
test('Hebrew reading markers are preserved without lexical claims',()=>{
 const raw=[line('Eng (Heb) Ref & Type','Hebrew'),line('Gen.1.001=Q(k)','בְּרֵאשִׁית')].join('\n');
 const bytes=Buffer.from(raw);
 const r=collectFixtureCandidates(bytes,{name:expectedFiles[2],sha256:sha(bytes),sourceCommit:'a'.repeat(40)});
 assert.equal(r.rows[0].reference,'Gen.1.001=Q(k)');
 assert.equal(r.status,'HUMAN_REVIEW_REQUIRED');
});
test('rejects tampering and unknown inputs',()=>{
 const bytes=Buffer.from('abc');
 const m={name:expectedFiles[0],sha256:sha(bytes),sourceCommit:'a'.repeat(40)};
 assert.throws(()=>collectFixtureCandidates(Buffer.from('abcd'),m),/mismatch/);
 assert.throws(()=>collectFixtureCandidates(bytes,{...m,name:'bad.txt'}),/Approved/);
 assert.throws(()=>collectFixtureCandidates(bytes,m,{perTarget:99}),/sampling/);
});
