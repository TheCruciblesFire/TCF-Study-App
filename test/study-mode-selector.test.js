import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(p,'utf8');
test('landing screen offers two labeled accessible study choices',()=>{
 const html=read('public/index.html');
 assert.match(html,/data-study-mode="explore" aria-pressed="true"/);
 assert.match(html,/data-study-mode="guided" aria-pressed="false"/);
 assert.match(html,/CHOOSE HOW YOU'D LIKE TO STUDY/);
});
test('guided selection automatically launches existing inductive steps while preserving normal chat',()=>{
 const ui=read('public/app.js');
 const guide=read('public/inductive-guide.js');
 assert.match(ui,/autoStart: studyMode === 'guided'/);
 assert.match(ui,/setStudyMode\('explore'\)/);
 assert.match(guide,/if \(autoStart\) begin\(\)/);
 assert.match(guide,/start\.addEventListener\('click', begin\)/);
});
