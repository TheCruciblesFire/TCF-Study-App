import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessPhase9AExit} from '../scripts/assess-phase9a-exit.js';
const commit='a'.repeat(40);
const index={metadata:{dataset:'TAGNT',sourceCommit:commit,license:'CC BY 4.0'},entries:{
 'Jhn.15.4':[{reference:'Jhn.15.4',position:1,strong:'G3306',surface:'μένω',lemma:'μένω',transliteration:'menō',morphology:'V-PAI',edition:'SBL'}]}};
const approval={reviewed:true,independentSource:'independent reviewed source witness',reviewer:'reviewer',
 sourceRowSha256:'b'.repeat(64),sourceCommit:commit,tokenId:'Jhn.15.4:1:SBL',
 verseAlignmentVerified:true,lexicalMappingVerified:true};
test('empty approval and previously structural-only data cannot pass',()=>{
 assert.deepEqual(assessPhase9AExit(index,[]).blockers,['NO_INDEPENDENT_APPROVALS']);
 assert.equal(assessPhase9AExit(index,[{...approval,lexicalMappingVerified:false}]).ready,false);
});
test('fully attested bounded index can pass its mechanical contract',()=>{
 const r=assessPhase9AExit(index,[approval]);assert.equal(r.ready,true);assert.equal(r.checked,1);
});
test('rejects excess coverage, duplicate positions and unmatched approvals',()=>{
 assert.throws(()=>assessPhase9AExit(index,[approval],{maxTokens:0}),/Bounded/);
 assert.equal(assessPhase9AExit(index,[{...approval,tokenId:'Jhn.15.4:2:SBL'}]).ready,false);
});
