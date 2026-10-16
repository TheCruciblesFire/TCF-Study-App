import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(file, 'utf8');
test('interpretation route binds to latest authorized study and existing usage controls', () => {
 const app=read('server/app.js');
 assert.match(app,/\/api\/study\/interpretation-feedback/);
 assert.match(app,/controlling\.reference !== body\.data\.reference/);
 assert.match(app,/providers\.interpretationFeedback\(controlling\.reference, controlling\.text, body\.data\.notes, meter\)/);
 assert.match(app,/reservation = store\.reserve\(\)/);
 assert.match(app,/store\.settle\(reservation, meter, true\)/);
});
test('provider separates direct text, contextual inference, synthesis and uncertainty', () => {
 const source=read('server/providers.js');
 assert.match(source,/async function interpretationFeedback/);
 assert.match(source,/strong contextual inferences/);
 assert.match(source,/broader theological syntheses/);
 assert.match(source,/uncertain or unsupported conclusions/);
 assert.match(source,/schema.safeParse|feedbackSchema.safeParse/);
});
test('UI offers feedback only on interpretation stage and live mode', () => {
 const guide=read('public/inductive-guide.js'),ui=read('public/app.js');
 assert.match(guide,/stage === 1 && requestInterpretationFeedback/);
 assert.match(guide,/Get interpretation feedback/);
 assert.match(ui,/requestInterpretationFeedback: config\?\.mode === 'live'/);
 assert.match(ui,/\/api\/study\/interpretation-feedback/);
});
