// Export authentic, pinned STEPBible source-row candidates for manual review.
// This is not a semantic parser and must never mark fixtures as reviewed.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { expectedFiles } from './stepbible-source-audit.js';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const REF = /^[1-3]?[A-Za-z]{2,5}\.\d{1,3}\.[^=\t]{1,32}=[^\t]+$/;
export function extractAuthenticFixtureCandidates(bytes, file, commit, {limit=8}={}) {
 if (!file || !expectedFiles.includes(file.name) || !/^[a-f0-9]{64}$/.test(file.sha256??'') ||
     !/^[a-f0-9]{40}$/.test(commit??'')) throw Error('Pinned source manifest required');
 if (!(Buffer.isBuffer(bytes)||bytes instanceof Uint8Array)) throw Error('Original bytes required');
 if (sha(bytes)!==file.sha256) throw Error('Pinned source SHA-256 mismatch');
 if (!Number.isInteger(limit)||limit<1||limit>24) throw Error('Limit must be 1..24');
 const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');
 const dataset=file.name.startsWith('TAGNT ') ? 'TAGNT':'TAHOT';
 const lines=raw.split(/\r?\n/),expected=[],skipped={annotation:0,nonToken:0,width:0};
 const accepted=new Set();
 for(let i=0;i<lines.length;i++){
   const cells=lines[i].split('\t'), ref=cells[0].trim();
   if(!lines[i].trim())continue;
   if(ref.startsWith('#')||ref.startsWith('$')||ref.startsWith('//')){skipped.annotation++;continue;}
   if(!REF.test(ref)){skipped.nonToken++;continue;}
   if(cells.length!==17){skipped.width++;continue;}
   const book=ref.split('.')[0];
   // Collect a spread of examples rather than only the first verse.
   const classKey=book+':'+(ref.includes('(')?'parenthesized':'plain')+':'+ref.split('=')[1];
   if(accepted.has(classKey))continue;
   accepted.add(classKey);
   if(expected.length>=limit)continue;
   expected.push({line:i+1,reference:ref,rawRowSha256:sha(Buffer.from(lines[i],'utf8')),
     // Values require manual cross-check against original source and documentation.
     columnChecks:cells.map((value,index)=>({column:index+1,value})),
     verifiedMeaning:false});
 }
 if(!expected.length)throw Error('No candidate source token rows: source layout review required');
 return {reviewed:false,reviewer:null,dataset,sourceCommit:commit,
   sourceFile:file.name,sourceSha256:file.sha256,license:'CC BY 4.0',
   expected,skipped,status:'CANDIDATES_UNREVIEWED',
   warning:'Generated from authentic bytes, but no lexical/verse semantics have been reviewed. Do not set reviewed=true automatically.'};
}
export function exportFromManifest(manifest,{limit=8}={}){
 if(!manifest||manifest.license!=='CC BY 4.0'||!/^[a-f0-9]{40}$/.test(manifest.sourceCommit??'')||
    !Array.isArray(manifest.files)||manifest.files.length!==6)throw Error('Complete pinned source manifest required');
 const found=new Set();
 const reports=manifest.files.map(file=>{
  if(found.has(file.name)||!expectedFiles.includes(file.name)||!file.localPath)throw Error('Duplicate or unknown source');
  found.add(file.name);
  return extractAuthenticFixtureCandidates(readFileSync(file.localPath),file,manifest.sourceCommit,{limit});
 });
 if(found.size!==6)throw Error('Six distinct sources required');
 return reports;
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
 const [manifestPath,outPath]=process.argv.slice(2);
 if(!manifestPath||!outPath)throw Error('Usage: node scripts/export-stepbible-fixture-candidates.js MANIFEST.json OUTPUT.json');
 writeFileSync(outPath,JSON.stringify(exportFromManifest(JSON.parse(readFileSync(manifestPath,'utf8'))),null,2)+'\n',{flag:'wx'});
}
