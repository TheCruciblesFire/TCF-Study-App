// Source-documented field locations; no decoding of lexical meaning.
// See upstream STEPBible-Data README and pinned TAGNT/TAHOT column headings.
const SCHEMA=Object.freeze({
 TAGNT:Object.freeze({reference:1,surfaceWithTransliteration:2,english:3,strongGrammar:4,lemmaGloss:5,editions:6}),
 TAHOT:Object.freeze({reference:1,surface:2,transliteration:3,english:4,strongGrammar:5,morphology:6})
});
const SAFE=value=>typeof value==='string'&&!/[\u0000-\u001f<>]/.test(value)&&value.length<=2000;
export function inspectDocumentedStepFields(record) {
 if (!record || !Object.hasOwn(SCHEMA,record.dataset) ||
     !Array.isArray(record.rawColumns)||record.rawColumns.length!==17 ||
     !record.rawColumns.every(SAFE) || record.rawColumns[0]!==record.rawReference)
     throw Error('Expected authentic 17-column source record');
 const indexes=SCHEMA[record.dataset], raw={};
 for(const [name,index] of Object.entries(indexes))raw[name]=record.rawColumns[index-1];
 if(!raw.surface && !raw.surfaceWithTransliteration) throw Error('Missing original-language surface');
 if(!raw.strongGrammar) throw Error('Missing original lexical field');
 const risks=[];
 if(record.dataset==='TAGNT'){
   if(!/^G\d{4,5}[A-Za-z]?=[^=\t]+$/.test(raw.strongGrammar))risks.push('UNREVIEWED_GREEK_STRONG_GRAMMAR');
   if(!raw.editions || !/^[A-Za-z0-9+ -]+$/.test(raw.editions)) risks.push('EDITION_REVIEW_REQUIRED');
 } else {
   if(!/^H\d+/.test(raw.strongGrammar) && !/^\{H\d+/.test(raw.strongGrammar))
     risks.push('UNREVIEWED_HEBREW_STRONG_EXPRESSION');
   if(/[{}\/]/.test(raw.strongGrammar)) risks.push('HEBREW_COMPOUND_OR_AFFIX_REVIEW');
   if(!raw.morphology) risks.push('HEBREW_MORPHOLOGY_MISSING');
 }
 return {dataset:record.dataset,rawReference:record.rawReference,columns:indexes,raw,
   risks,sourceFieldsDocumented:true,lexicalSemanticsVerified:false,
   canonicalAlignmentVerified:false,status:'DOCUMENTED_FIELDS_RAW_VALUES_ONLY'};
}
