import { test } from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {expectedFiles} from '../scripts/stepbible-source-audit.js';
import {verifyReviewedFixture} from '../scripts/verify-stepbible-golden-fixtures.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
const commit='a'.repeat(40);
const source=(dataset,ref,word)=>{
 const header=[dataset==='TAGNT'?'Word & Type':'Eng (Heb) Ref & Type',...Array(16).fill('')].join('\t');
 const cells=[ref,word,...Array(15).fill('')],row=cells.join('\t');
 const bytes=Buffer.from(header+'\n'+row+'\n');
 const file={name:dataset==='TAGNT'?expectedFiles[0]:expectedFiles[2],sha256:sha(bytes)};
 const fixture={reviewed:true,reviewer:'independent-review-example',sourceFile:file.name,sourceSha256:file.sha256,dataset,
   expected:[{line:2,reference:ref,rawRowSha256:sha(row),columnChecks:[{column:1,value:ref},{column:2,value:word}]}]};
 return {bytes,file,fixture};
};
test('Greek and Hebrew checked rows preserve precise source column indices',()=>{
 for (const [dataset,ref,word] of [['TAGNT','Mat.1.001=NKO','λόγος'],['TAHOT','Gen.1.001=Q(k)','בְּרֵאשִׁית']]) {
  const {bytes,file,fixture}=source(dataset,ref,word);
  const result=verifyReviewedFixture(bytes,file,commit,fixture);
  assert.equal(result.verifiedFixtures,1);
  assert.equal(result.status,'REVIEWED_RAW_SOURCE_FIXTURES_ONLY');
 }
});
test('rejects unchecked fixtures, mistaken values, and changed raw row digests',()=>{
 const {bytes,file,fixture}=source('TAGNT','Mat.1.001=NKO','λόγος');
 assert.throws(()=>verifyReviewedFixture(bytes,file,commit,{...fixture,reviewed:false}),/Independent/);
 assert.throws(()=>verifyReviewedFixture(bytes,file,commit,{...fixture,expected:[{...fixture.expected[0],rawRowSha256:'0'.repeat(64)}]}),/digest/);
 assert.throws(()=>verifyReviewedFixture(bytes,file,commit,{...fixture,expected:[{...fixture.expected[0],columnChecks:[{column:2,value:'wrong'}]}]}),/column mismatch/);
 assert.throws(()=>verifyReviewedFixture(bytes,file,commit,{...fixture,expected:[{...fixture.expected[0],columnChecks:[{column:18,value:'x'}]}]}),/column mismatch/);
});
