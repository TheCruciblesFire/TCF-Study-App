import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildLexicalStudyPacket} from '../server/lexical-study-packet.js';
const commit='a'.repeat(40);
const row={reference:'Jhn.15.4',position:2,strong:'G3306',surface:'μένω',lemma:'μένω',
 transliteration:'menō',morphology:'V-PAI',edition:'SBL'};
const dataset={metadata:{sourceCommit:commit},entries:{'Jhn.15.4':[row]}};
const approvals=[{reviewed:true,sourceCommit:commit,tokenId:'Jhn.15.4:2:SBL',
 sourceRowSha256:'b'.repeat(64),independentSource:'independent witness',reviewer:'reviewer',
 verseAlignmentVerified:true,lexicalMappingVerified:true,strong:'G3306',lemma:'μένω'}];
const dicts={G:{entries:{G3306:{id:'G3306',lemma:'μένω',gloss:'remain; abide',source:'reviewed',license:'CC BY 4.0'}},
 metadata:{attribution:'STEPBible'}}};
test('bounded, explicitly approved occurrence returns general lexical gloss without contextual claims',()=>{
 const packet=buildLexicalStudyPacket('John 15:4',dataset,approvals,dicts);
 assert.equal(packet.length,1);assert.equal(packet[0].reference,'Jhn.15.4');
 assert.equal(packet[0].lexicalGloss,'remain; abide');
 assert.match(packet[0].note,/not a verified English word alignment/);
});
test('unapproved and inconsistent source records are silently omitted',()=>{
 assert.deepEqual(buildLexicalStudyPacket('John 15:4',dataset,[],dicts),[]);
 assert.deepEqual(buildLexicalStudyPacket('John 15:4',dataset,[{...approvals[0],strong:'G1'}],dicts),[]);
 assert.deepEqual(buildLexicalStudyPacket('John 15:4',{...dataset,metadata:{sourceCommit:'c'.repeat(40)}},approvals,dicts),[]);
 assert.deepEqual(buildLexicalStudyPacket('John 15',dataset,approvals,dicts),[]);
});
