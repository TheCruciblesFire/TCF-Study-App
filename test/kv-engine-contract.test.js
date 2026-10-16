import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { methodology as legacy } from '../server/methodology.js';
import { methodology, ENGINE_VERSION, describeStudyMode, createStudyContract } from '../packages/kv-study-engine/index.js';

const historic = readFileSync('docs/kv-methodology.md', 'utf8');
test('shared engine preserves exact live KV methodology', () => {
 assert.equal(legacy, methodology);
 assert.match(methodology,/Observe before interpreting/);
 assert.match(methodology,/authorized translation controls this app/);
 assert.match(historic,/709d036e3d5a36d03824f9bbb3021ac5b1bc2f92/);
 assert.equal(ENGINE_VERSION,'0.1.0');
});
test('only existing approved quick and passage modes are enabled', () => {
 for (const kind of ['question','passage']) assert.equal(describeStudyMode(kind).supported,true);
 for (const kind of ['inductive','topical','lexical','audit','unsupported']) assert.equal(describeStudyMode(kind).supported,false);
});
test('study contract requires verified controlling sources and unique IDs', () => {
 const route = { kind:'passage', main:'John 15:1–8' };
 const study = createStudyContract({route,sources:[{id:'S1',reference:'John 15:1–8'},{id:'S2',reference:'John 14:21'}]});
 assert.equal(study.controllingReference,'John 15:1–8');
 assert.deepEqual(study.sourceIds,['S1','S2']);
 assert.equal(study.limits.specialistAudits,false);
 assert.throws(()=>createStudyContract({route,sources:[]}),/controlling source/);
 assert.throws(()=>createStudyContract({route,sources:[{id:'S1',reference:'John 15:1–8'},{id:'S1',reference:'John 14:21'}]}),/unique/);
 assert.equal(createStudyContract({route:{kind:'unsupported'},sources:[]}).supported,false);
});
