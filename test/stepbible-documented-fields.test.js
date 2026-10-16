import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectDocumentedStepFields} from '../scripts/inspect-stepbible-documented-fields.js';
const record=(dataset,cells)=>({dataset,rawReference:cells[0],rawColumns:[...cells,...Array(17-cells.length).fill('')]});
test('Greek documented fields retain morphology/edition and do not claim decoded meanings',()=>{
 const r=inspectDocumentedStepFields(record('TAGNT',['Mat.1.1#01=NKO','Βίβλος (Biblos)','book','G0976=N-NSF','βίβλος=book','NA28+NA27+Tyn+SBL+WH+Treg+TR+Byz']));
 assert.equal(r.raw.strongGrammar,'G0976=N-NSF');
 assert.equal(r.columns.strongGrammar,4);
 assert.equal(r.lexicalSemanticsVerified,false);
 assert.deepEqual(r.risks,[]);
});
test('Hebrew composite identifiers remain unchanged and are explicitly flagged',()=>{
 const r=inspectDocumentedStepFields(record('TAHOT',['Gen.1.1#01=L','בְּ/רֵאשִׁ֖ית','be./re.Shit','in beginning','H9003/{H7225G}','HR/Ncfsa']));
 assert.equal(r.raw.strongGrammar,'H9003/{H7225G}');
 assert.equal(r.columns.morphology,6);
 assert.ok(r.risks.includes('HEBREW_COMPOUND_OR_AFFIX_REVIEW'));
 assert.equal(r.canonicalAlignmentVerified,false);
});
test('unknown and malformed records are rejected',()=>{
 assert.throws(()=>inspectDocumentedStepFields(record('UNKNOWN',['Mat.1.1#01=L','w','x','G0976=N-NSF'])),/authentic/);
 assert.throws(()=>inspectDocumentedStepFields({dataset:'TAGNT',rawReference:'x',rawColumns:['x']}),/authentic/);
 assert.throws(()=>inspectDocumentedStepFields(record('TAGNT',['Mat.1.1#01=NKO','word','translation','','lemma','SBL'])),/Missing original lexical/);
});
