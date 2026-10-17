import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
test('two accessible top-level approaches, original lookup UI absent',()=>{
 assert.deepEqual([...html.matchAll(/data-study-mode="([^"]+)"/g)].map(m=>m[1]),['explore','blb']);
 assert.doesNotMatch(html,/id="lexical-tool"|id="strong-form"/);
 assert.doesNotMatch(js,/lexicalForm|strong-form|lexical-tool/);
 assert.match(html,/Ask &amp; Learn/);
 assert.doesNotMatch(html,/Guided Study/);
 assert.doesNotMatch(js,/createInductiveGuide/);
});
test('BLB gateway preserves original GET search and selected translation independent of Bible API',()=>{
 assert.match(html,/action="https:\/\/www\.blueletterbible\.org\/search\/search\.cfm" method="get" target="_top"/);
 assert.match(html,/name="Criteria"/);
 assert.match(html,/name="t"/);
 assert.match(html,/<option value="CSB" selected>/);
 assert.match(html,/name="cscs" maxlength/);
 assert.match(html,/blueletterbible\.org\/csb\/jhn\/3\/16\//);
 assert.doesNotMatch(html,/name="cscs" disabled/);
 assert.match(js,/const range = blbRange\.value\.trim\(\)/);
 assert.doesNotMatch(html,/preSearch\.cfm/);
});
test('BLB mode hides composer/starters; Ask and Learn and new-study reset remain',()=>{
 assert.match(js,/studyMode === 'blb'/);
 assert.match(js,/\$\('#blb-gateway'\)\.hidden = studyMode !== 'blb'/);
 assert.match(js,/document\.querySelector\('\.composer-wrap'\)\.hidden = studyMode === 'blb'/);
 assert.match(js,/setStudyMode\('explore'\)/);
 assert.match(css,/#blb-gateway\[hidden\]/);
});

test('BLB site fallback is voluntary and never refreshes external pages',()=>{assert.match(html,/open Blue Letter Bible directly/);assert.match(html,/class="blb-fallback-note"/);assert.doesNotMatch(js,/location\.reload\(/);});

test('BLB search uses an explicit user-triggered navigation with stable params',()=>{
 assert.match(js,/blbForm\.addEventListener\('submit', event => \{/);
 assert.match(js,/import \{ parseReference \} from '\.\/references\.js'/);
 assert.match(js,/const passage = parseReference\(criteria\)/);
 assert.match(js,/url\.pathname = url\.pathname\.replace/);
 assert.match(js,/event\.preventDefault\(\)/);
 assert.match(js,/url\.searchParams\.set\('Criteria', criteria\)/);
 assert.match(js,/link\.href = blbSearchUrl\(word\)/);
 assert.match(js,/answer\.csbPassage\?\.fumsToken/);
 assert.match(js,/link\.href = blbPassageUrl\(answer\.sources\[0\]\.url\)/);
 assert.match(js,/link\.href = blbPassageUrl\(source\.url\)/);
 assert.doesNotMatch(js,/blbVerseToolsUrl/);
 assert.doesNotMatch(js,/handoff\.href = blbSearchUrl/);
 assert.match(js,/url\.searchParams\.set\('t',/);
 assert.match(js,/if \(range\) url\.searchParams\.set\('cscs', range\)/);
 assert.match(js,/window\.top\.location\.href = url\.href/);
});
