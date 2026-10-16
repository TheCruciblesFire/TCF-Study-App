// Offline lexical risk classification. Never promotes source strings to verified senses.
import {parseStepReference} from './stepbible-raw-reference.js';
const GREEK=/^G\d{4,5}[A-Za-z]?=([A-Za-z0-9-]+)$/;
const HEBREW_SIMPLE=/^\{?H\d{4,5}[A-Za-z]?\}?$/;
export function classifyStepLexicalRecord(record) {
 if(!record || !['TAGNT','TAHOT'].includes(record.dataset) ||
   !Array.isArray(record.rawColumns) || record.rawColumns.length!==17 ||
   !record.rawColumns.every(x=>typeof x==='string'))
   throw Error('Authentic raw source record required');
 const reference=parseStepReference(record.rawReference);
 if(!reference || record.rawColumns[0]!==record.rawReference)throw Error('Invalid positioned reference');
 const greek=record.dataset==='TAGNT';
 const expression=record.rawColumns[greek?3:4];
 const morphology=greek?null:record.rawColumns[5];
 const flags=[];
 if(greek) {
   if(!GREEK.test(expression)) flags.push('UNSUPPORTED_GREEK_STRONG_GRAMMAR');
   if(!record.rawColumns[5])flags.push('MISSING_GREEK_EDITION_METADATA');
   if(/[()+]/.test(reference.readingMarker))flags.push('GREEK_VARIANT_REVIEW_REQUIRED');
 } else {
   if(!HEBREW_SIMPLE.test(expression))flags.push('COMPOUND_OR_EXTENDED_HEBREW_IDENTIFIER');
   if(!morphology)flags.push('MISSING_HEBREW_MORPHOLOGY');
   if(/Q|K|\(|\)/i.test(reference.readingMarker))flags.push('KETIV_QERE_REVIEW_REQUIRED');
   if(reference.alternateVerseText)flags.push('ALTERNATE_VERSIFICATION_REVIEW_REQUIRED');
 }
 return {dataset:record.dataset,reference,rawStrongGrammar:expression,
   rawMorphology:morphology,flags,status:flags.length?'EXCLUDED_PENDING_REVIEW':'RAW_STRUCTURE_ONLY',
   lexicalMeaningVerified:false,verseAlignmentVerified:false};
}
