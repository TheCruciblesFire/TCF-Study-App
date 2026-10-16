// Build a bounded review packet of REAL STEPBible source rows.
// Review candidates are not approved lexical/verse fixtures.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {expectedFiles} from './stepbible-source-audit.js';

const sha = value => createHash('sha256').update(value).digest('hex');
const TARGETS = Object.freeze({
 TAGNT: [/^Mat\.1\./,/^Jhn\.1\./,/^Rom\.5\./],
 TAHOT: [/^Gen\.1\./,/^1Sa\.1\./,/^Isa\.53\./]
});
export function collectFixtureCandidates(bytes, {name,sha256,sourceCommit}, {perTarget=2}={}) {
 if (!expectedFiles.includes(name) || !/^[a-f0-9]{64}$/.test(sha256??'') ||
 !/^[a-f0-9]{40}$/.test(sourceCommit??'') || !Buffer.isBuffer(bytes))
 throw Error('Approved file, source bytes and pinned provenance required');
 if (sha(bytes)!==sha256) throw Error('Source SHA-256 mismatch');
 if (!Number.isInteger(perTarget)||perTarget<1||perTarget>5) throw Error('Invalid sampling limit');
 const dataset=name.startsWith('TAGNT ')?'TAGNT':'TAHOT';
 const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');
 const rows=[],count=new Map(), rejected={width:0,reference:0}, lines=raw.split(/\r?\n/);
 let headerSeen=false;
 const expectedHeader=dataset==='TAGNT'?'Word & Type':'Eng (Heb) Ref & Type';
 for(let i=0;i<lines.length;i++){
  const fields=lines[i].split('\t');
  if(fields[0]?.trim()===expectedHeader){headerSeen=true;continue;}
  const first=fields[0]?.trim()??'';
  const target=TARGETS[dataset].find(r=>r.test(first));
  if(!target)continue;
  const key=target.source;
  if((count.get(key)??0)>=perTarget)continue;
  if(!headerSeen){rejected.reference++;continue;}
  if(fields.length!==17){rejected.width++;continue;}
  // Preserve reference/variant marker verbatim; don't infer Strong or morphology.
  if(!/^[1-3]?[A-Za-z]{2,5}\.\d{1,3}\.[^=\t]+=[^\t]+$/.test(first)){
   rejected.reference++;continue;
  }
  rows.push({line:i+1,reference:first,rawRowSha256:sha(lines[i]),
   columns:fields.map((value,j)=>({column:j+1,value}))});
  count.set(key,(count.get(key)??0)+1);
 }
 return {dataset,sourceFile:name,sourceCommit,sourceSha256:sha256,
  license:'CC BY 4.0',attribution:'STEP Bible / STEPBible.org; derived review samples',
  reviewed:false,status:'HUMAN_REVIEW_REQUIRED',candidateCount:rows.length,
  rejected,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [manifestPath,outputPath]=process.argv.slice(2);
 if(!manifestPath||!outputPath)throw Error('Usage: node scripts/collect-stepbible-fixture-candidates.js manifest.json output.json');
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 if(manifest.license!=='CC BY 4.0'||!/^[a-f0-9]{40}$/.test(manifest.sourceCommit??'')||
 !Array.isArray(manifest.files)||manifest.files.length!==6)throw Error('Six pinned sources required');
 const seen=new Set();
 const result=manifest.files.map(file=>{
  if(seen.has(file.name))throw Error('Duplicate source');seen.add(file.name);
  return collectFixtureCandidates(readFileSync(file.localPath),{...file,sourceCommit:manifest.sourceCommit});
 });
 if(seen.size!==6)throw Error('Incomplete source set');
 writeFileSync(outputPath,JSON.stringify({status:'UNREVIEWED_SOURCE_FIXTURE_CANDIDATES',
  sourceCommit:manifest.sourceCommit,files:result},null,2)+'\n');
}
