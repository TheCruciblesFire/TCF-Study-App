import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractMappingEvidence } from '../scripts/extract-stepbible-mapping-evidence.js';

test('TAGNT token rows separated from headings, comments and variants', () => {
 const raw = ['STEP Documentation\t'+ '\t'.repeat(15),
 'Word & Type\tword\tstrong\t'+ '\t'.repeat(13),
 '#_Significant variant\t'+ '\t'.repeat(15),
 'Mat.1.001=NKO\tλόγος\tG3056\tN-NSM\t4\t5\t6\t7',
 'Mrk.1.001=N(k)O\tform\tG1\tMorph\t4\t5\t6\t7'].join('\n');
 const r=extractMappingEvidence(raw,'TAGNT');
 assert.equal(r.counts.tokenCandidates,2);
 assert.equal(r.counts.columnHeadings,1);
 assert.equal(r.counts.variantMarkers,1);
 assert.equal(r.tokenRowShapes[0].columnCount,8);
 assert.equal(r.mappingReviewed,false);
 assert.equal(JSON.stringify(r).includes('λόγος'),false);
 assert.equal(JSON.stringify(r).includes('G3056'),false);
});
test('TAHOT parenthesized references remain candidate rows', () => {
 const r=extractMappingEvidence('Eng (Heb) Ref & Type\tword\nGen.1.001=L\tבְּרֵאשִׁית\tH7225\t3\t4\t5\t6\t7\nDeu.1.2(1.3)04=L(p)\ta\tH1\t3\t4\t5\t6\t7','TAHOT');
 assert.equal(r.counts.tokenCandidates,2);
 assert.equal(r.counts.columnHeadings,1);
 assert.equal(JSON.stringify(r).includes('H7225'),false);
});
test('reject invalid dataset and corrupted UTF-8',()=>{
 assert.throws(()=>extractMappingEvidence('x','UNKNOWN'),/TAGNT or TAHOT/);
 assert.throws(()=>extractMappingEvidence('x\uFFFDy','TAGNT'),/Invalid UTF-8/);
});
