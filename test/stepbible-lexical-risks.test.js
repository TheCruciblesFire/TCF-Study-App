import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyStepLexicalRecord} from '../scripts/classify-stepbible-lexical-risks.js';
const record=(dataset,reference,expr,morph='')=>{
 const columns=Array(17).fill('');
 columns[0]=reference;columns[dataset==='TAGNT'?3:4]=expr;
 if(dataset==='TAGNT') columns[5]='NA28+SBL';else columns[5]=morph;
 return {dataset,rawReference:reference,rawColumns:columns};
};
test('Greek morphology is retained as opaque source text',()=>{
 const r=classifyStepLexicalRecord(record('TAGNT','Mat.1.1#01=NKO','G0976=N-NSF'));
 assert.equal(r.status,'RAW_STRUCTURE_ONLY');
 assert.equal(r.lexicalMeaningVerified,false);
});
test('Greek textual variants require additional review',()=>{
 const r=classifyStepLexicalRecord(record('TAGNT','Mat.1.1#01=N(k)O','G0976=N-NSF'));
 assert.ok(r.flags.includes('GREEK_VARIANT_REVIEW_REQUIRED'));
});
test('Hebrew compounds and ketiv/qere cannot be silently normalized',()=>{
 const r=classifyStepLexicalRecord(record('TAHOT','Gen.1.1#01=Q(k)','H9003/{H7225G}','HR/Ncfsa'));
 assert.ok(r.flags.includes('COMPOUND_OR_EXTENDED_HEBREW_IDENTIFIER'));
 assert.ok(r.flags.includes('KETIV_QERE_REVIEW_REQUIRED'));
 assert.equal(r.status,'EXCLUDED_PENDING_REVIEW');
});
test('missing source structure fails closed',()=>{
 assert.throws(()=>classifyStepLexicalRecord({}),/Authentic raw/);
 assert.throws(()=>classifyStepLexicalRecord(record('TAGNT','Mat.1.1=NKO','G0976=N-NSF')), /positioned reference/);
});
