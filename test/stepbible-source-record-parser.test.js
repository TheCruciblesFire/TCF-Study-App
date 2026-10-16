import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStepSourceRecords} from '../scripts/parse-stepbible-source-records.js';
const commit='a'.repeat(40),hash='b'.repeat(64);
const options=dataset=>({dataset,sourceCommit:commit,sourceSha256:hash});
const row=(ref,fields=[])=>[ref,...fields,...Array(16-fields.length).fill('')].join('\t');
test('Greek 17-column source rows retain editions, markers and raw morphology',()=>{
 const heading=row('Word & Type',['Greek','English translation','dStrongs = Grammar','Dictionary form = Gloss']);
 const source=[heading,row('Mat.1.1#01=NKO',['λόγος','word','G3056=V','lemma','NKO']), '#_Significant variant\tother'].join('\n');
 const result=parseStepSourceRecords(source,options('TAGNT'));
 assert.equal(result.count,1);
 assert.equal(result.rows[0].referenceParts.readingMarker,'NKO');
 assert.equal(result.rows[0].values.dStrongsGrammar,'G3056=V');
 assert.equal(result.excluded.annotation,1);
 assert.equal(result.metadata.status,'RAW_RECORDS_ONLY');
});
test('Hebrew original content and ketiv/qere-like markers remain uninterpreted',()=>{
 const heading=row('Eng (Heb) Ref & Type',['Hebrew','Transliteration']);
 const result=parseStepSourceRecords([heading,row('Gen.1.1#01=Q(k)',['בְּרֵאשִׁית','berešit'])].join('\n'),options('TAHOT'));
 assert.equal(result.rows[0].values.hebrew,'בְּרֵאשִׁית');
 assert.equal(result.rows[0].referenceParts.readingMarker,'Q(k)');
});
test('fails closed on missing headers, wrong widths, unpinned inputs or invalid dataset',()=>{
 assert.throws(()=>parseStepSourceRecords(row('Mat.1.1#01=NKO',['a']),options('TAGNT')), /before dataset column header/);
 assert.throws(()=>parseStepSourceRecords('Word & Type\ta'+'\n'+row('Mat.1.1#01=NKO'),options('TAGNT')), /column-heading width/);
 assert.throws(()=>parseStepSourceRecords('',options('TAGNT')), /heading/);
 assert.throws(()=>parseStepSourceRecords('',{...options('TAGNT'),sourceCommit:'master'}), /Pinned/);
 assert.throws(()=>parseStepSourceRecords('',options('X')), /Dataset/);
});
