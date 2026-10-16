import {readFileSync,writeFileSync} from 'node:fs';
// Independently specified structural assertions for the pinned six-source review packet.
// These are not claims of lexical sense, textual-edition equivalence, or canonical alignment.
import { parseStepReference } from './stepbible-raw-reference.js';
const EXPECTED = Object.freeze([
 {filePrefix:'TAGNT Mat-Jhn',reference:'Mat.1.1#01=NKO',positions:[2,4,5,6,12],tokens:['Βίβλος (Biblos)','G0976=N-NSF','βίβλος=book','NA28+NA27+Tyn+SBL+WH+Treg+TR+Byz','G0976']},
 {filePrefix:'TAGNT Act-Rev',reference:'Rom.5.1#01=NKO',positions:[2,4,5,6,12],tokens:['Δικαιωθέντες (Dikaiōthentes)','G1344=V-APP-NPM','δικαιόω=to justify','NA28+NA27+Tyn+SBL+WH+Treg+TR+Byz','G1344']},
 {filePrefix:'TAHOT Gen-Deu',reference:'Gen.1.1#01=L',positions:[3,5,6,9],tokens:['be./re.Shit','H9003/{H7225G}','HR/Ncfsa','H7225G']},
 {filePrefix:'TAHOT Jos-Est',reference:'1Sa.1.1#01=L',positions:[3,5,6,9],tokens:['va/y.Hi','H9001/{H1961}','Hc/Vqw3ms','H1961']},
 {filePrefix:'TAHOT Job-Sng',reference:'Job.1.1#01=L',positions:[3,5,6,9],tokens:["'ish",'{H0376G}','HNcmsa','H0376G_A']},
 {filePrefix:'TAHOT Isa-Mal',reference:'Isa.53.1#01=L',positions:[3,5,6,9],tokens:['mi','{H4310}','HPi','H4310_A']}
]);
export function validatePinnedReviewCandidates(packet,{sourceCommit}={}) {
 if (!packet || packet.status!=='UNREVIEWED_SOURCE_FIXTURE_CANDIDATES' ||
     !/^[a-f0-9]{40}$/.test(sourceCommit??'') || packet.sourceCommit!==sourceCommit ||
     !Array.isArray(packet.files) || packet.files.length!==6)
   throw Error('Expected complete pinned unreviewed source packet');
 if (!packet.files.every(f=>f && typeof f.sourceFile==='string' && f.sourceFile.length>0))
   throw Error('Missing, duplicated or malformed source evidence');
 const seen=new Set(),results=[];
 for(const e of EXPECTED){
   const file=packet.files.find(f=>f.sourceFile.startsWith(e.filePrefix));
   if(!file || seen.has(file.sourceFile) || file.reviewed!==false ||
       file.sourceCommit!==sourceCommit || !/^[a-f0-9]{64}$/.test(file.sourceSha256??''))
     throw Error('Missing, duplicated or unapproved source evidence: '+e.filePrefix);
   seen.add(file.sourceFile);
   const row=file.rows?.find(r=>r.reference===e.reference);
   if(!row || !Number.isInteger(row.line) || row.line<1 ||
       !/^[a-f0-9]{64}$/.test(row.rawRowSha256??'') ||
       !Array.isArray(row.columns) || row.columns.length!==17)
     throw Error('Missing authentic 17-column candidate: '+e.reference);
   if(!row.columns.every((c,i)=>c.column===i+1 && typeof c.value==='string') ||
      row.columns[0].value!==row.reference)throw Error('Corrupted source column order: '+e.reference);
   const ref=parseStepReference(row.reference);
   if(!ref || ref.position!==1 || ref.canonicalAlignmentVerified!==false)
     throw Error('Reference shape mismatch: '+e.reference);
   for(let i=0;i<e.positions.length;i++) {
     if(row.columns[e.positions[i]-1].value!==e.tokens[i])
       throw Error('Source field assertion mismatch at column '+e.positions[i]+': '+e.reference);
   }
   results.push({file:file.sourceFile,reference:row.reference,checkedColumns:e.positions,
     sourceSha256:file.sourceSha256,rawRowSha256:row.rawRowSha256});
 }
 return {status:'AUTHENTIC_SOURCE_SHAPES_CHECKED_SEMANTICS_UNREVIEWED',records:results,
   warning:'Literal source observations only. No independent Strong interpretation, morphology decoding, Hebrew reading reconciliation or canonical alignment approved.'};
}

if(process.argv[1]?.endsWith('/validate-stepbible-authentic-candidates.js')) {
 const [input,commit,output]=process.argv.slice(2);
 if(!input||!commit||!output)throw Error('Usage: node scripts/validate-stepbible-authentic-candidates.js CANDIDATES.json COMMIT REPORT.json');
 const result=validatePinnedReviewCandidates(JSON.parse(readFileSync(input,'utf8')),{sourceCommit:commit});
 writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 console.log('Checked '+result.records.length+' authentic structural source records (semantics unreviewed)');
}
