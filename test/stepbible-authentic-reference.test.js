import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStepReference,preserveStepLexicalExpression} from '../scripts/stepbible-raw-reference.js';
import {parseStepSourceRecords} from '../scripts/parse-stepbible-source-records.js';
const pinned={sourceCommit:'a'.repeat(40),sourceSha256:'b'.repeat(64)};
const row=(ref,extras=[])=>[ref,...extras,...Array(16-extras.length).fill('')].join('\t');
test('authentic Greek and Hebrew positioned references preserve positions and reading markers',()=>{
 const greek=parseStepReference('Mat.1.1#01=NKO');
 assert.deepEqual([greek.book,greek.chapter,greek.verse,greek.position,greek.readingMarker],['Mat',1,1,1,'NKO']);
 const hebrew=parseStepReference('Gen.1.1#01=L');
 assert.equal(hebrew.readingMarker,'L');
 assert.equal(hebrew.canonicalAlignmentVerified,false);
});
test('rejects reference guesswork and does not strip lexical suffixes and affixes',()=>{
 for(const s of ['Mat.1.001=NKO','Mat.1.1=NKO','Foo.1.1#01=L','Gen.0.1#01=L','Gen.1.1#00=L'])
   assert.equal(parseStepReference(s),null);
 assert.equal(preserveStepLexicalExpression('H9003/{H7225G}').raw,'H9003/{H7225G}');
 assert.equal(preserveStepLexicalExpression('H9003/{H7225G}').interpreted,false);
});
test('17-column parsed source row keeps raw composite identifier without flattening',()=>{
 const text=row('Eng (Heb) Ref & Type')+'\n'+row('Gen.1.1#01=L',['בְּ/רֵאשִׁ֖ית','be./re.Shit','in/ beginning','H9003/{H7225G}','HR/Ncfsa']);
 const parsed=parseStepSourceRecords(text,{dataset:'TAHOT',...pinned});
 assert.equal(parsed.count,1);
 assert.equal(parsed.rows[0].referenceParts.position,1);
 assert.equal(parsed.rows[0].lexicalExpression.raw,'H9003/{H7225G}');
 assert.equal(parsed.rows[0].rawColumns.length,17);
});
