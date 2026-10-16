import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateReviewedLexicalMapping} from '../scripts/validate-stepbible-semantic-map.js';
const row=(dataset,reference,expression)=>({dataset,line:12,rawReference:reference,
 rawColumns:[reference,'original','romanized','translation',expression,...Array(12).fill('')]});
const approval=(dataset,expression)=>({reviewed:true,reviewer:'fixture-reviewer',
 documentation:'Pinned STEPBible column documentation independently inspected',
 sourceCommit:'a'.repeat(40),sourceSha256:'b'.repeat(64),dataset,
 fields:[{name:'surface',column:2,expectedRaw:'original',evidence:'Source header and row confirmed'},
 {name:'strongExpression',column:5,expectedRaw:expression,evidence:'Source header and row confirmed'}]});
test('opaque compound Hebrew field is preserved without claiming lexical semantics',()=>{
 const value='H9003/{H7225G}',record=row('TAHOT','Gen.1.1#01=L',value);
 const result=validateReviewedLexicalMapping(record,approval('TAHOT',value));
 assert.equal(result.fields.strongExpression.raw,value);
 assert.equal(result.verifiedLexicalSemantics,false);
 assert.equal(result.verifiedVerseAlignment,false);
});
test('Greek source mapping requires explicit correct column position',()=>{
 const record=row('TAGNT','Mat.1.1#01=NKO','G0976=N-NSF');
 const result=validateReviewedLexicalMapping(record,approval('TAGNT','G0976=N-NSF'));
 assert.equal(result.fields.strongExpression.column,5);
});
test('rejects unapproved, altered, ambiguous or incomplete field reviews',()=>{
 const value='{H7225G}',record=row('TAHOT','Gen.1.1#01=L',value),a=approval('TAHOT',value);
 assert.throws(()=>validateReviewedLexicalMapping(record,{...a,reviewed:false}),/Independent/);
 assert.throws(()=>validateReviewedLexicalMapping(record,{...a,fields:a.fields.slice(0,1)}),/Strong expression/);
 assert.throws(()=>validateReviewedLexicalMapping(record,{...a,fields:[...a.fields,{...a.fields[1]}]}),/conflicting/);
 assert.throws(()=>validateReviewedLexicalMapping(record,{...a,fields:[a.fields[0],{...a.fields[1],expectedRaw:'H7225'}]}),/conflicting/);
 assert.throws(()=>validateReviewedLexicalMapping({...record,rawReference:'Gen.1.1=L'},a),/source-reference/);
});
