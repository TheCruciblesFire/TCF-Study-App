import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(file, 'utf8');
test('application feedback requires matching session source and budget reservation', () => {
 const app=read('server/app.js');
 assert.match(app,/\/api\/study\/application-feedback/);
 assert.match(app,/notes: z\.string\(\)\.trim\(\)\.min\(10\)\.max\(1200\)/);
 assert.match(app,/controlling\.reference !== body\.data\.reference/);
 assert.match(app,/providers\.applicationFeedback\(controlling\.reference, controlling\.text, body\.data\.notes, meter\)/);
 assert.match(app,/reservation = store\.reserve\(\)/);
 assert.match(app,/store\.settle\(reservation, meter, true\)/);
});
test('application provider distinguishes commands, personal responses, and unsupported promises', () => {
 const source=read('server/providers.js');
 assert.match(source,/async function applicationFeedback/);
 assert.match(source,/distinguish explicit biblical commands from optional personal applications/);
 assert.match(source,/prosperity formulas/);
 assert.match(source,/do not impose a Christological claim/);
 assert.match(source,/feedbackSchema.safeParse\(response\)/);
});
test('application feedback is optional, stage-three only, and live-only', () => {
 const guide=read('public/inductive-guide.js'),ui=read('public/app.js');
 assert.match(guide,/stage === 2 && requestApplicationFeedback/);
 assert.match(guide,/Get application feedback/);
 assert.match(ui,/requestApplicationFeedback: config\?\.mode === 'live'/);
 assert.match(ui,/\/api\/study\/application-feedback/);
});
