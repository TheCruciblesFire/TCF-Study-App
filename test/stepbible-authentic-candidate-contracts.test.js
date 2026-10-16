import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validatePinnedReviewCandidates} from '../scripts/validate-stepbible-authentic-candidates.js';
const commit='bd09545c7a44b39ace20f16c0359915f2aa23a62';
test('requires exactly six pinned source candidates',()=>{
 assert.throws(()=>validatePinnedReviewCandidates({status:'UNREVIEWED_SOURCE_FIXTURE_CANDIDATES',sourceCommit:commit,files:[]},{sourceCommit:commit}),/complete pinned/);
 assert.throws(()=>validatePinnedReviewCandidates({status:'UNREVIEWED_SOURCE_FIXTURE_CANDIDATES',sourceCommit:commit,files:Array(6).fill({})},{sourceCommit:commit}),/Missing, duplicated/);
 assert.throws(()=>validatePinnedReviewCandidates({status:'UNREVIEWED_SOURCE_FIXTURE_CANDIDATES',sourceCommit:commit,files:[null,...Array(5).fill({sourceFile:'x'})]},{sourceCommit:commit}),/malformed/);
});
test('rejects unpinned or wrongly labeled evidence packets',()=>{
 assert.throws(()=>validatePinnedReviewCandidates(null,{sourceCommit:commit}),/complete pinned/);
 assert.throws(()=>validatePinnedReviewCandidates({status:'REVIEWED',sourceCommit:commit,files:Array(6).fill({})},{sourceCommit:commit}),/complete pinned/);
 assert.throws(()=>validatePinnedReviewCandidates({status:'UNREVIEWED_SOURCE_FIXTURE_CANDIDATES',sourceCommit:commit,files:Array(6).fill({})},{sourceCommit:'a'.repeat(40)}),/complete pinned/);
});
