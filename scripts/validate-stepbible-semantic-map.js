// Offline, explicitly reviewed semantic assertion gate. A source field name,
// Strong-looking text, or parsed morphology does not itself establish meaning.
import {parseStepReference} from './stepbible-raw-reference.js';
const HEX40=/^[a-f0-9]{40}$/,HEX64=/^[a-f0-9]{64}$/;
const SAFE=x=>typeof x==='string'&&x.length>0&&x.length<=300&&!/[<>\u0000-\u001f]/.test(x);
export function validateReviewedLexicalMapping(record, approval) {
 if(!record || !approval || approval.reviewed!==true ||
   !SAFE(approval.reviewer) || !SAFE(approval.documentation) ||
   !HEX40.test(approval.sourceCommit??'') || !HEX64.test(approval.sourceSha256??'') ||
   !['TAGNT','TAHOT'].includes(approval.dataset) ||
   !Array.isArray(record.rawColumns) || record.rawColumns.length!==17 ||
   approval.dataset!==record.dataset || !Array.isArray(approval.fields) || !approval.fields.length)
   throw Error('Independent source-specific semantic review required');
 if(!record.rawColumns.every(x=>typeof x==='string'))throw Error('Invalid raw source columns');
 const ref=parseStepReference(record.rawReference);
 if(!ref || record.rawColumns[0]!==record.rawReference || !Number.isInteger(record.line))
   throw Error('Unverified authentic source-reference structure');
 const mapped=Object.create(null),used=new Set();
 for(const field of approval.fields){
   if(!field || !['surface','transliteration','lemma','gloss','strongExpression','morphology','readingMarker'].includes(field.name) ||
      used.has(field.name) || !Number.isInteger(field.column) || field.column<1 || field.column>17 ||
      !SAFE(field.expectedRaw) || record.rawColumns[field.column-1]!==field.expectedRaw ||
      !SAFE(field.evidence))
      throw Error('Missing or conflicting independent column review');
   used.add(field.name);
   // Explicit raw observations only; compound/suffixed Strong values remain intact.
   mapped[field.name]={raw:field.expectedRaw,column:field.column,evidence:field.evidence,interpreted:false};
 }
 if(!used.has('surface') || !used.has('strongExpression'))
   throw Error('Reviewed surface and Strong expression required');
 return {dataset:record.dataset,reference:ref,sourceCommit:approval.sourceCommit,
   sourceSha256:approval.sourceSha256,reviewer:approval.reviewer,documentation:approval.documentation,
   fields:mapped,status:'REVIEWED_RAW_FIELD_MAPPING_ONLY',
   verifiedVerseAlignment:false,verifiedLexicalSemantics:false,
   warning:'Field locations manually attested. Strong senses, grammatical decoding, textual edition meaning and verse-level accuracy require independent validation.'};
}
