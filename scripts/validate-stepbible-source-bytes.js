// Validate exact source bytes before calling the offline, unverified record parser.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expectedFiles } from './stepbible-source-audit.js';
import { parseStepSourceRecords } from './parse-stepbible-source-records.js';

export function parseVerifiedSourceBytes(bytes, file, sourceCommit) {
 if (!file || !expectedFiles.includes(file.name) ||
   typeof file.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(file.sha256) ||
   !/^[a-f0-9]{40}$/.test(sourceCommit ?? '')) throw Error('Pinned recognized source and SHA-256 required');
 if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) throw Error('Expected original source bytes');
 const actual = createHash('sha256').update(bytes).digest('hex');
 if (actual !== file.sha256) throw Error('Source checksum mismatch: '+file.name);
 const dataset=file.name.startsWith('TAGNT ') ? 'TAGNT' : 'TAHOT';
 const decoded = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 const parsed = parseStepSourceRecords(decoded,{dataset,sourceCommit,sourceSha256:actual});
 return {...parsed,metadata:{...parsed.metadata,sourceFile:file.name,checksumVerified:true}};
}

// Consume a previously audited manifest without trusting filenames or metadata
// by themselves. All original bytes are re-read and rehashed.
export function validateSourceManifest(manifest) {
 if (!manifest || manifest.license !== 'CC BY 4.0' ||
   !/^[a-f0-9]{40}$/.test(manifest.sourceCommit ?? '') ||
   !Array.isArray(manifest.files) || manifest.files.length !== expectedFiles.length)
   throw Error('Six pinned CC BY 4.0 sources required');
 const seen=new Set(), reports=[];
 for (const file of manifest.files) {
   if (!file || seen.has(file.name) || !expectedFiles.includes(file.name) ||
     typeof file.localPath !== 'string' || !file.localPath) throw Error('Missing, duplicate or unexpected source');
   seen.add(file.name);
   const parsed=parseVerifiedSourceBytes(readFileSync(file.localPath),file,manifest.sourceCommit);
   reports.push({name:file.name,dataset:parsed.metadata.dataset,sha256:parsed.metadata.sourceSha256,
     count:parsed.count,headingsSeen:parsed.headingsSeen,excluded:parsed.excluded,
     status:'RAW_RECORDS_VERIFIED_BYTES_ONLY'});
 }
 if (seen.size !== expectedFiles.length) throw Error('Incomplete source inventory');
 return {sourceCommit:manifest.sourceCommit,license:'CC BY 4.0',reports,
   status:'NO_SEMANTIC_ALIGNMENT_VERIFIED'};
}
