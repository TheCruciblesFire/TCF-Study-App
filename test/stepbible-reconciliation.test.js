import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileTaggedRows } from '../scripts/reconcile-stepbible-rows.js';
const columns=['Verse','Order','StrongRef','Original','Dictionary','Romanized','ParseCode','TextEdition'];
const fieldColumns={reference:'Verse',position:'Order',strong:'StrongRef',surface:'Original',lemma:'Dictionary',
  transliteration:'Romanized',morphology:'ParseCode',edition:'TextEdition'};
const map={reviewed:true,dataset:'TAGNT',sourceCommit:'a'.repeat(40),sourceSha256:'b'.repeat(64),
 columns,fieldColumns,allowedEditions:['SBL','TR'],variantPolicy:'explicit-single-edition-per-row',mappingId:'fixture-only'};
const line=(strong='G3306',edition='SBL')=>['Jhn.15.4','3',strong,'μένω','μένω','menō','V-PAI',edition].join('\t');
test('requires an exact reviewed source header and edition',()=>{
 const index=reconcileTaggedRows(columns.join('\t')+'\n'+line()+'\n',map);
 assert.equal(index.count,1);assert.equal(index.entries['Jhn.15.4'][0].transliteration,'menō');
 assert.throws(()=>reconcileTaggedRows('Verse\tOrder\n'+line(),map),/headers/);
 assert.throws(()=>reconcileTaggedRows(columns.join('\t')+'\n'+line('G3306','NA28'),map),/edition/);
});
test('rejects suffixes, combined edition labels, duplicates, and unreviewed mappings',()=>{
 const head=columns.join('\t')+'\n';
 assert.throws(()=>reconcileTaggedRows(head+line('G3306a'),map),/Extended/);
 assert.throws(()=>reconcileTaggedRows(head+line('G3306','SBL/TR'),map),/edition/);
 assert.throws(()=>reconcileTaggedRows(head+line()+'\n'+line(),map),/Duplicate/);
 assert.throws(()=>reconcileTaggedRows(head+line(),{...map,reviewed:false}),/Reviewed/);
});
test('rejects Greek labels attached to Hebrew words',()=>{
 const input=columns.join('\t')+'\n'+['Gen.1.1','1','H7225','בְּרֵאשִׁית','רֵאשִׁית','rēʾšît','N-fs','WLC'].join('\t');
 assert.throws(()=>reconcileTaggedRows(input,map),/edition/);
 const result=reconcileTaggedRows(input,{...map,dataset:'TAHOT',allowedEditions:['WLC']});
 assert.equal(result.entries['Gen.1.1'][0].strong,'H7225');
});
