import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INDUCTIVE_STAGES, createInductiveGuide } from '../public/inductive-guide.js';

test('guided stages preserve observation before interpretation before application', () => {
  assert.deepEqual(INDUCTIVE_STAGES.map(s => s.title), ['Observation','Interpretation','Application']);
  assert.match(INDUCTIVE_STAGES[0].prompt, /before explaining/);
  assert.match(INDUCTIVE_STAGES[1].prompt, /literary context/);
  assert.match(INDUCTIVE_STAGES[2].prompt, /faithful response/);
});
test('guide rejects malformed section group inputs', () => {
  assert.throws(() => createInductiveGuide({sections:[],reference:'John 15'}),/three existing/);
  assert.throws(() => createInductiveGuide({sections:[[1],[],null],reference:'John 15'}),/three existing/);
});
test('guided study remains local-only and preview-integrated', () => {
  const source=readFileSync('public/inductive-guide.js','utf8');
  const preview=readFileSync('scripts/build-preview.js','utf8');
  const ui=readFileSync('public/app.js','utf8');
  assert.doesNotMatch(source,/fetch\(|localStorage|sessionStorage|\/api\//);
  assert.match(preview,/standaloneModule\('public\/inductive-guide.js'\)/);
  assert.match(ui,/createInductiveGuide\(/);
});
