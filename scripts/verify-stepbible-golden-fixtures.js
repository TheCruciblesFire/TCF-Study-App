// Human-reviewed golden fixtures for genuine pinned STEPBible source rows.
// Expectations must be supplied independently; this module cannot approve them.
import { createHash } from 'node:crypto';
import { parseVerifiedSourceBytes } from './validate-stepbible-source-bytes.js';

const digest = value => createHash('sha256').update(value, 'utf8').digest('hex');
export function verifyReviewedFixture(bytes, file, commit, fixture) {
 if (!fixture || fixture.reviewed !== true || !fixture.reviewer ||
     fixture.sourceFile !== file?.name || fixture.sourceSha256 !== file?.sha256 ||
     !Array.isArray(fixture.expected) || !fixture.expected.length)
   throw Error('Independent reviewed source expectations required');
 const parsed=parseVerifiedSourceBytes(bytes,file,commit);
 if (fixture.dataset !== parsed.metadata.dataset) throw Error('Fixture dataset mismatch');
 const seen=new Set(),results=[];
 for (const expected of fixture.expected) {
   if (!Number.isSafeInteger(expected.line) || expected.line<1 ||
     !/^[a-f0-9]{64}$/.test(expected.rawRowSha256??'') ||
     typeof expected.reference !== 'string' || !expected.reference ||
     !Array.isArray(expected.columnChecks) || !expected.columnChecks.length)
     throw Error('Reviewed line, row hash, reference and column checks required');
   if (seen.has(expected.line)) throw Error('Duplicate reviewed fixture line');
   seen.add(expected.line);
   const row=parsed.rows.find(x=>x.line===expected.line);
   if (!row || row.rawReference!==expected.reference || row.rawColumns.length!==17)
     throw Error('Reviewed reference or column shape mismatch on line '+expected.line);
   if (digest(row.rawColumns.join('\t'))!==expected.rawRowSha256)
     throw Error('Source row digest mismatch on line '+expected.line);
   for (const check of expected.columnChecks) {
     if (!Number.isInteger(check.column) || check.column<1 || check.column>17 ||
       typeof check.value !== 'string' || row.rawColumns[check.column-1]!==check.value)
       throw Error('Reviewed column mismatch on line '+expected.line);
   }
   results.push({line:expected.line,reference:row.rawReference,checkedColumns:expected.columnChecks.length});
 }
 return {sourceFile:file.name,sourceSha256:file.sha256,reviewedBy:fixture.reviewer,
   verifiedFixtures:results.length,results,status:'REVIEWED_RAW_SOURCE_FIXTURES_ONLY',
   warning:'Raw source checks are not independent verse mapping, morphology, Strong ID or edition reconciliation.'};
}
