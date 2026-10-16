import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parseVerifiedSourceBytes } from '../scripts/validate-stepbible-source-bytes.js';
import { expectedFiles } from '../scripts/stepbible-source-audit.js';

const commit='a'.repeat(40);
const heading=label=>[label,...Array(16).fill('')].join('\t');
const token=(ref,word)=>[ref,word,...Array(15).fill('')].join('\t');
const fixture=(dataset,ref,word)=>Buffer.from(
 heading(dataset==='TAGNT'?'Word & Type':'Eng (Heb) Ref & Type')+'\n'+token(ref,word)+'\n','utf8');
const file=(name,bytes)=>({name,sha256:createHash('sha256').update(bytes).digest('hex')});
test('checks original Greek bytes and retains opaque reference text',()=>{
 const bytes=fixture('TAGNT','Mat.1.001=NKO','λόγος');
 const parsed=parseVerifiedSourceBytes(bytes,file(expectedFiles[0],bytes),commit);
 assert.equal(parsed.count,1);
 assert.equal(parsed.metadata.checksumVerified,true);
 assert.equal(parsed.rows[0].referenceParts.readingMarker,'NKO');
 assert.equal(parsed.rows[0].reviewStatus,'unverified-source-values');
});
test('checks Hebrew source bytes with reading marker preserved',()=>{
 const bytes=fixture('TAHOT','Gen.1.001=Q(k)','בְּרֵאשִׁית');
 const parsed=parseVerifiedSourceBytes(bytes,file(expectedFiles[2],bytes),commit);
 assert.equal(parsed.rows[0].referenceParts.readingMarker,'Q(k)');
 assert.equal(parsed.metadata.dataset,'TAHOT');
});
test('rejects tampered bytes, invalid UTF-8 and unknown source name',()=>{
 const bytes=fixture('TAGNT','Mat.1.001=NKO','text');
 const entry=file(expectedFiles[0],bytes);
 assert.throws(()=>parseVerifiedSourceBytes(Buffer.concat([bytes,Buffer.from('tamper')]),entry,commit),/checksum mismatch/);
 const invalid=Buffer.from([0xff,0xfe]);
 assert.throws(()=>parseVerifiedSourceBytes(invalid,file(expectedFiles[0],invalid),commit), /encoded|encoding|UTF-8|valid/i);
 assert.throws(()=>parseVerifiedSourceBytes(bytes,{...entry,name:'untrusted.txt'},commit),/Pinned recognized/);
 assert.throws(()=>parseVerifiedSourceBytes(bytes,entry,'master'),/Pinned recognized/);
});
