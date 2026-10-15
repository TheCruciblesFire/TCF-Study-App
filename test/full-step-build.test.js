import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildFullLexicon } from '../scripts/build-full-step.js';
function blobSha(s) {const bytes=Buffer.from(s);return createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');}
const greek=['eStrong\tdStrong\tuStrong\tGreek\tTransliteration\tMorph\tGloss\tMeaning','G0026\tG0026 =\tG0026\tἀγάπη\tagapē\tG:N-F\tlove\tentry','G3056\tG3056 =\tG3056\tλόγος\tlogos\tG:N-M\tword\tentry','G0001\tG0001G =\tG0001G\tα\tAlpha\tG:N-LI\tAlpha\tentry','G0001\tG0001H =\tG0001H\tἆ\ta\tG:INJ\tah!\tentry'].join('\n');
test('full STEP build preserves integrity, produces indexed entries and exclusion report',()=>{
 const x=buildFullLexicon(greek,{language:'G',blobSha:blobSha(greek),commit:'a'.repeat(40),sourceUrl:'https://github.com/STEPBible/STEPBible-Data/blob/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Lexicons/TBESG'});
 assert.equal(x.audit.imported,2);
 assert.equal(x.audit.excluded,1);
 assert.equal(x.index.entries.G26.gloss,'love');
 assert.equal(x.index.entries.G1,undefined);
 assert.throws(()=>buildFullLexicon(greek,{language:'G',blobSha:'0'.repeat(40),commit:'a'.repeat(40),sourceUrl:x.audit.sourceUrl}),/source identity/);
});
