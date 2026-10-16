// Offline, lossless *source-record* parser, not a validated verse lexicon.
// Indices reflect reviewed source headings, but encoded values remain raw.
export const SOURCE_FIELDS = Object.freeze({
 TAGNT: ['wordType','greek','englishTranslation','dStrongsGrammar','dictionaryFormGloss','editions','meaningVariants','spellingVariants','spanishTranslation','subMeaning','conjoinWord','sStrongInstance','altStrongs'],
 TAHOT: ['referenceType','hebrew','transliteration','englishTranslation','strongGrammar','morphology','meaningVariants','spellingVariants','strongField9','strongField10','field11','strongField12']
});
const HEADER = {TAGNT:'Word & Type',TAHOT:'Eng (Heb) Ref & Type'};
const REFERENCE = /^([1-3]?[A-Za-z]{2,5})\.([0-9]{1,3})\.([^=\t]{1,32})=([^\t]+)$/;
export function parseStepSourceRecords(raw,{dataset,sourceCommit,sourceSha256}={}) {
 if (!SOURCE_FIELDS[dataset]) throw Error('Dataset must be TAGNT or TAHOT');
 if (!/^[a-f0-9]{40}$/.test(sourceCommit??'') || !/^[a-f0-9]{64}$/.test(sourceSha256??''))
   throw Error('Pinned source commit and SHA-256 required');
 if(typeof raw!=='string'||raw.includes('\uFFFD')) throw Error('Invalid source UTF-8');
 const rows=[],excluded={},headings=new Set();
 const lines=raw.replace(/^\uFEFF/,'').split(/\r?\n/);
 let headerObserved=false;
 for(let i=0;i<lines.length;i++){
   const line=lines[i];if(!line.trim())continue;
   const cells=line.split('\t'),first=cells[0].trim();
   if(first===HEADER[dataset]) {
     if(cells.length!==17)throw Error('Unexpected column-heading width at line '+(i+1));
     headerObserved=true;
     headings.add(cells.join('\t'));
     continue;
   }
   if(first.startsWith('#')||first.startsWith('$')||first.startsWith('//')) {
     excluded.annotation=(excluded.annotation??0)+1;continue;
   }
   const match=REFERENCE.exec(first);
   if(!match){excluded.nonToken=(excluded.nonToken??0)+1;continue;}
   if(!headerObserved)throw Error('Token before dataset column header at line '+(i+1));
   if(cells.length!==17)throw Error('Unexpected token column count at line '+(i+1));
   const values=Object.create(null);
   SOURCE_FIELDS[dataset].forEach((field,index)=>{values[field]=cells[index];});
   rows.push({dataset,line:i+1,rawReference:first,referenceParts:{
     book:match[1],chapterText:match[2],verseAndPositionText:match[3],readingMarker:match[4]},
     values,rawColumns:cells.slice(),extraColumns:cells.slice(SOURCE_FIELDS[dataset].length),
     reviewStatus:'unverified-source-values'});
 }
 if(!headerObserved)throw Error('No authentic source column heading found');
 return {metadata:{dataset,sourceCommit,sourceSha256,license:'CC BY 4.0',
  attribution:'STEPBible.org / Tyndale House Cambridge',status:'RAW_RECORDS_ONLY',
  warning:'Do not interpret Strong IDs, morphology, editions, original-language tokens or verse alignment from these raw values.'},
  count:rows.length,headingsSeen:headings.size,excluded,rows};
}
