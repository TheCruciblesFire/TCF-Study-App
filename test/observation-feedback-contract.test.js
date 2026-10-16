import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(file, 'utf8');
test('observation feedback route verifies live session, bounded input, and budget', () => {
  const app = read('server/app.js');
  assert.match(app, /\/api\/study\/observation-feedback/);
  assert.match(app, /notes: z\.string\(\)\.trim\(\)\.min\(10\)\.max\(1200\)/);
  assert.match(app, /controlling\.reference !== body\.data\.reference/);
  assert.match(app, /reservation = store\.reserve\(\)/);
  assert.match(app, /store\.settle\(reservation, meter, true\)/);
});
test('feedback generation uses supplied controlling text and bounded structured schema', () => {
  const providers = read('server/providers.js');
  assert.match(providers, /async function observationFeedback\(reference, scripture, notes, meter\)/);
  assert.match(providers, /learnerObservations: notes/);
  assert.match(providers, /Do not introduce other biblical texts/);
  assert.match(providers, /schema, 470, meter/);
});
test('feedback remains optional and live-only, without altering demo preview', () => {
  const ui = read('public/app.js');
  const guide = read('public/inductive-guide.js');
  assert.match(ui, /config\?\.mode === 'live'/);
  assert.match(guide, /Get observation feedback/);
  assert.match(guide, /stage === 0 && requestFeedback/);
  assert.match(guide, /response\.feedback\.observation/);
});
