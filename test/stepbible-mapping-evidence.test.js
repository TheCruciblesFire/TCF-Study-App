import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractMappingEvidence } from '../scripts/extract-stepbible-mapping-evidence.js';

test('TAGNT evidence records shapes without exporting word contents', () => {
 const raw = '# Morphology and Strong column notes\nMat.1.001=NKO\tλόγος\tG3056\tN-NSM\tother\t6\t7\t8\n';
 const report = extractMappingEvidence(raw, 'TAGNT');
 assert.equal(report.mappingReviewed, false);
 assert.equal(report.inspectedDataRows, 1);
 assert.equal(report.representativeShapes[0].columnCount, 8);
 assert.equal(JSON.stringify(report).includes('λόγος'), false);
 assert.equal(JSON.stringify(report).includes('G3056'), false);
});
test('TAHOT layouts are inspected without semantic assumptions', () => {
 const raw = 'Gen.1.001=L\tבְּרֵאשִׁית\tH7225\t3\t4\t5\t6\t7\n';
 const report = extractMappingEvidence(raw, 'TAHOT');
 assert.equal(report.inspectedDataRows, 1);
 assert.equal(report.representativeShapes[0].columnCount, 8);
 assert.equal(JSON.stringify(report).includes('H7225'), false);
});
test('invalid datasets and replacement UTF-8 are rejected', () => {
 assert.throws(() => extractMappingEvidence('x', 'UNKNOWN'), /TAGNT or TAHOT/);
 assert.throws(() => extractMappingEvidence('x\uFFFDy', 'TAGNT'), /Invalid UTF-8/);
});
