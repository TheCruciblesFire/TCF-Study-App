import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectUpstream } from '../scripts/inspect-stepbible-upstream.js';
import { expectedFiles } from '../scripts/stepbible-source-audit.js';
test('matches actual filenames and records missing files without guessing',async()=>{
 const commit='a'.repeat(40);
 const request=async()=>({ok:true,json:async()=>expectedFiles.map((name,i)=>({type:'file',name,size:i+100,sha:'b'.repeat(40)}))});
 const report=await inspectUpstream(commit,{request});
 assert.equal(report.canUseExistingDownloader,true);
 assert.equal(report.missingExpected.length,0);
 const mismatch=await inspectUpstream(commit,{request:async()=>({ok:true,json:async()=>[]})});
 assert.equal(mismatch.canUseExistingDownloader,false);
 assert.equal(mismatch.missingExpected.length,6);
 await assert.rejects(()=>inspectUpstream('master',{request}),/pinned/);
});
