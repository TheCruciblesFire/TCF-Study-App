import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('landing screen offers two labeled accessible study choices',()=>{
 const html=read('public/index.html');
 assert.match(html,/data-study-mode="explore" aria-pressed="true"/);
 assert.match(html,/data-study-mode="blb" aria-pressed="false"/);
 assert.doesNotMatch(html,/data-study-mode="guided"/);
 assert.match(html,/CHOOSE HOW YOU'D LIKE TO STUDY/);
});
test('Ask and Learn preserves normal chat without launching the in-app guide',()=>{
 const ui=read('public/app.js');
 assert.doesNotMatch(ui,/autoStart: studyMode === 'guided'|createInductiveGuide/);
 assert.match(ui,/setStudyMode\('explore'\)/);
 assert.match(ui,/studyMode = mode === 'blb' \? 'blb' : 'explore'/);
});
