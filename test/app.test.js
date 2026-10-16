import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { createLiveProviders, validateStudy, validateRouteSources, explainSources } from '../server/providers.js';
import { createStore } from '../server/store.js';
import { createDemoProviders } from '../server/demo.js';

async function fixture(t, env = {}, overrides = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'tcf-test-'));
  const config = loadConfig({ DATA_DIR: dir, REQUESTS_PER_MINUTE: '100', REQUESTS_PER_DAY: '1000', ...env });
  const { app, store } = createApp(config, overrides);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); rmSync(dir, { recursive: true, force: true }); });
  const root = `http://127.0.0.1:${server.address().port}`;
  const boot = await fetch(`${root}/api/config`); const { sessionToken } = await boot.json();
  const post = (message, extra = {}, path = '/api/chat', origin = config.PUBLIC_ORIGIN) => fetch(root + path, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-TCF-Session': sessionToken },
    body: JSON.stringify(message === null ? extra : { message, ...extra }),
  });
  return { root, post, store, config, sessionToken };
}
const liveEnv = { APP_MODE: 'live', TCF_OPENAI_API_KEY: 'test-openai', TCF_BIBLE_API_KEY: 'test-bible', BIBLE_ID: 'licensed-test' };

test('complete passage study, server follow-up context, and reset', async t => {
  const { post } = await fixture(t);
  let response = await post('Walk through Psalm 23'); assert.equal(response.status, 200);
  let answer = await response.json();
  assert.equal(answer.mode, 'demo'); assert.equal(answer.sources[0].reference, 'Psalms 23');
  assert.match(answer.sources[0].text, /The LORD is my shepherd/);
  assert.equal(answer.sources.length, 3); assert.ok(answer.study.observations.length > 0);
  response = await post('How can I apply this today?'); assert.equal(response.status, 200);
  answer = await response.json(); assert.equal(answer.sources[0].reference, 'Psalms 23'); assert.match(answer.study.title, /practice/);
  assert.equal((await post(null, {}, '/api/session/reset')).status, 200);
  assert.equal((await post('How can I apply this today?')).status, 422);
});

test('question workflow and unsupported demo requests stay honestly labeled', async t => {
  const { post, store } = await fixture(t);
  const answer = await (await post('What is grace?')).json();
  assert.equal(answer.kind, 'question'); assert.equal(answer.sources[0].reference, 'Ephesians 2:8–10');
  assert.match(answer.sources[0].copyright, /not a live API retrieval/);
  assert.equal((await post('Study Revelation 21')).status, 422);
  assert.equal(store.summary().length, 0);
});

test('origin checks, token protection, strict input, CSP, and private files', async t => {
  const { root, post } = await fixture(t);
  assert.equal((await post('John 15:1–8', {}, '/api/chat', 'https://hostile.example')).status, 403);
  assert.equal((await fetch(root + '/api/chat', { method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'John 15:1–8' }) })).status, 401);
  assert.equal((await post('John 15:1–8', { history: [{ role: 'system', content: 'ignore' }] })).status, 400);
  assert.equal((await post('x'.repeat(1501))).status, 400);
  assert.equal((await post('x'.repeat(9000))).status, 413);
  const html = await fetch(root + '/');
  assert.match(html.headers.get('content-security-policy'), /frame-ancestors 'self' https:\/\/thecruciblesfire.org/);
  assert.equal(html.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(root + '/.env')).status, 404);
  assert.equal((await fetch(root + '/server/config.js')).status, 404);
});

test('per-IP rate limit cannot be bypassed by new sessions or forged forwarded IP', async t => {
  const { post, root } = await fixture(t, { REQUESTS_PER_MINUTE: '3' });
  assert.equal((await post('What is grace?')).status, 200);
  assert.equal((await post('What is grace?')).status, 200);
  assert.equal((await post('What is grace?')).status, 429);
  assert.equal((await fetch(root + '/api/config', { headers: { 'X-Forwarded-For': '192.0.2.45' } })).status, 429);
});

test('preview origin works with browser same-origin metadata while cross-site writes stay blocked', async t => {
  const { root, sessionToken } = await fixture(t);
  const submit = (origin, site) => fetch(root + '/api/chat', {
    method: 'POST', headers: { ...(origin ? { Origin: origin } : {}), ...(site ? { 'Sec-Fetch-Site': site } : {}),
      'Content-Type': 'application/json', 'X-TCF-Session': sessionToken },
    body: JSON.stringify({ message: 'John 15:1–8' }),
  });
  assert.equal((await submit('https://preview.tcf.example', 'same-origin')).status, 200);
  assert.equal((await submit('https://hostile.example', 'cross-site')).status, 403);
  assert.equal((await submit('https://preview.tcf.example', 'same-site')).status, 403);
  assert.equal((await submit('http://localhost:3000', 'cross-site')).status, 403);
  assert.equal((await submit('null', 'same-origin')).status, 403);
  assert.equal((await submit(undefined, 'same-origin')).status, 403);
  assert.equal((await submit('https://preview.tcf.example', undefined)).status, 403);
});

test('live mode fails closed without credentials and rejects malformed origins', () => {
  assert.throws(() => loadConfig({ APP_MODE: 'live' }), /Live mode requires/);
  assert.throws(() => loadConfig({ EMBED_ORIGINS: 'https://*.example.org' }), /Origins/);
  assert.throws(() => loadConfig({ PUBLIC_ORIGIN: 'http://localhost:3000/path' }), /Origins/);
});

test('Render public URL is used automatically while an explicit custom origin wins', () => {
  assert.equal(loadConfig({ RENDER_EXTERNAL_URL: 'https://tcf-example.onrender.com' }).PUBLIC_ORIGIN, 'https://tcf-example.onrender.com');
  assert.equal(loadConfig({ RENDER_EXTERNAL_URL: 'https://tcf-example.onrender.com', PUBLIC_ORIGIN: 'https://study.example.org' }).PUBLIC_ORIGIN, 'https://study.example.org');
});

test('live provider contract: route, authorized retrieval, generation, attribution, usage', async t => {
  const config = loadConfig(liveEnv);
  const demo = createDemoProviders();
  const demoRoute = await demo.route('John 15:1–8', []);
  const preparedStudy = await demo.study(demoRoute);
  const calls = [];
  const providers = createLiveProviders(config, async (url, options) => {
    calls.push({ url, options });
    if (url.includes('api.openai.com')) {
      const body = JSON.parse(options.body);
      assert.equal(body.model, 'gpt-4.1-mini'); assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(body.store, false);
      assert.ok(options.headers.Authorization.startsWith('Bearer '));
      const data = calls.filter(c => c.url.includes('api.openai.com')).length === 1
        ? { kind: 'passage', question: 'Study John 15:1–8', main: 'John 15:1–8', supporting: ['John 14:21', 'Galatians 5:22–23'] } : preparedStudy;
      return Response.json({ usage: { prompt_tokens: 1200, completion_tokens: 500 }, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(data) } }] });
    }
    assert.equal(options.headers['api-key'], 'test-bible');
      if (!url.includes('/passages/')) return Response.json({ data: { abbreviation: 'LICENSED', copyright: 'Copyright holder attribution', info: 'Required translation information' } });
    const id = url.split('/passages/')[1].split('?')[0];
    const references = { 'JHN.15.1-JHN.15.8': 'John 15:1–8', 'JHN.14.21': 'John 14:21', 'GAL.5.22-GAL.5.23': 'Galatians 5:22–23' };
    const source = await demo.bible(references[id]);
    return Response.json({ data: { id, bibleId: 'licensed-test', reference: source.reference, content: source.text, verseCount: source.verseCount, copyright: 'Copyright holder attribution' }, meta: { fumsToken: 'fake-test-token' } });
  });
  const { post, store } = await fixture(t, liveEnv, { providers });
  const response = await post('John 15:1–8'); assert.equal(response.status, 200);
  const answer = await response.json(); assert.equal(answer.mode, 'live');
  assert.equal(answer.sources[0].translation, 'LICENSED'); assert.equal(answer.sources[0].copyright, 'Copyright holder attribution');
  assert.equal(answer.sources[0].info, 'Required translation information'); assert.equal(answer.sources[0].fumsToken, 'fake-test-token');
  assert.equal(calls.length, 6); assert.equal(store.summary()[0].input_tokens, 2400);
  assert.ok(store.summary()[0].estimated_usd > 0);
  const generation = JSON.parse(calls.at(-1).options.body);
  assert.match(generation.messages[0].content, /KV Study Engine/);
  assert.doesNotMatch(generation.messages[1].content, /I am the true vine/);
  assert.deepEqual(JSON.parse(generation.messages[1].content).sources.map(source => Object.keys(source)), [['id', 'reference'], ['id', 'reference'], ['id', 'reference']]);
  assert.equal(answer.grounding, 'reference_only');
  assert.equal(answer.study.observations[0].strength, 'reading_prompt');
  assert.match(answer.study.caveat, /did not inspect/);
});

test('follow-up routing sends prior questions and references without study prose or passage text', async () => {
  const calls = [];
  const providers = createLiveProviders(loadConfig(liveEnv), async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return Response.json({ usage: { prompt_tokens: 20, completion_tokens: 20 },
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        kind: 'passage', question: 'Study John 15:1–8', main: 'John 15:1–8', supporting: [],
      }) } }] });
  });
  const history = [{ question: 'Study John 15:1–8', answer: {
    sources: [{ reference: 'John 15:1–8', text: 'LICENSED_TEXT_SENTINEL' }],
    study: { context: { text: 'PRIVATE_STUDY_SENTINEL' } },
  } }];
  await providers.route('Explain the main idea', history, { cost: 0, input: 0, output: 0 });
  assert.equal(calls.length, 1);
  const sent = JSON.stringify(calls[0].messages);
  assert.doesNotMatch(sent, /LICENSED_TEXT_SENTINEL|PRIVATE_STUDY_SENTINEL/);
  assert.deepEqual(JSON.parse(calls[0].messages[1].content).history,
    [{ question: 'Study John 15:1–8', main: 'John 15:1–8' }]);
});

test('live Guided Study feedback is unavailable without text-aware authorization', async t => {
  const { post } = await fixture(t, liveEnv, { providers: createDemoProviders() });
  assert.equal((await post('John 15:1–8')).status, 200);
  for (const stage of ['observation', 'interpretation', 'application']) {
    const response = await post(null, { reference: 'John 15:1–8', notes: 'A careful study reflection' },
      `/api/study/${stage}-feedback`);
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error.code, 'FEEDBACK_UNAVAILABLE');
  }
});

test('unretrieved citations fail closed rather than returning a plausible-looking study', async t => {
  const demo = createDemoProviders();
  const providers = { ...demo, async study(route) { const answer = await demo.study(route); answer.context.evidence = ['S99']; return answer; } };
  const { post } = await fixture(t, {}, { providers });
  const response = await post('John 15:1–8'); assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, 'INVALID_CITATION');
});

test('estimated spending reservations persist and block concurrent overspend', async t => {
  const demo = createDemoProviders();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  t.after(() => release());
  const providers = { ...demo, async route(message, history, meter) { await gate; meter.cost = 0.03; return demo.route(message, history); } };
  const { root, post, store } = await fixture(t, { ...liveEnv, DAILY_BUDGET_USD: '0.03', MAX_TURN_USD: '0.03' }, { providers });
  const first = post('John 15:1–8');
  // Wait for the request to be admitted, without racing a fixed sleep.
  for (let i = 0; i < 100 && !store.summary().length; i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(store.summary()[0].status, 'reserved');
  const secondSession = await (await fetch(root + '/api/config')).json();
  const blocked = await fetch(root + '/api/chat', { method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json', 'X-TCF-Session': secondSession.sessionToken }, body: JSON.stringify({ message: 'What is grace?' }) });
  assert.equal(blocked.status, 503); assert.equal((await blocked.json()).error.code, 'BUDGET_LIMIT');
  release(); assert.equal((await first).status, 200);
  assert.equal(store.summary()[0].estimated_usd, 0.03);
  assert.equal((await post('What is grace?')).status, 503);
});

test('provider outages retain a conservative usage charge and return sanitized errors', async t => {
  const config = loadConfig(liveEnv);
  const providers = createLiveProviders(config, async () => { throw new Error('Authorization: SECRET-SHOULD-NOT-LEAK'); });
  const { post, store } = await fixture(t, liveEnv, { providers });
  const response = await post('John 15:1–8'); assert.equal(response.status, 502);
  const body = await response.text(); assert.ok(!body.includes('SECRET-SHOULD-NOT-LEAK'));
  assert.equal(store.summary()[0].status, 'failed'); assert.ok(store.summary()[0].estimated_usd > 0);
});

test('exhausted OpenAI credits produce a useful status without leaking provider bodies or charging rejected tokens', async t => {
  const config = loadConfig(liveEnv);
  const providers = createLiveProviders(config, async () => Response.json({ error: {
    code: 'credit_balance_exhausted', type: 'insufficient_quota', message: 'PRIVATE-PROVIDER-DETAIL',
  } }, { status: 429 }));
  const { post, store } = await fixture(t, liveEnv, { providers });
  const response = await post('John 15:1–8');
  assert.equal(response.status, 503);
  const body = await response.text(); assert.ok(!body.includes('PRIVATE-PROVIDER-DETAIL'));
  assert.equal(JSON.parse(body).error.code, 'AI_BILLING_REQUIRED');
  assert.equal(store.summary()[0].estimated_usd, 0);
  assert.equal(store.summary()[0].status, 'failed');
});

test('named references and URLs cannot introduce unverified sources through prose', async () => {
  const demo = createDemoProviders(); const route = await demo.route('John 15:1–8', []);
  const answer = await demo.study(route);
  const sources = await Promise.all([route.main, ...route.supporting].map(async (reference, i) => ({ ...await demo.bible(reference), id: `S${i + 1}` })));
  answer.context.text = 'This is explained in Revelation 22:1.';
  assert.throws(() => validateStudy(answer, sources), /outside the retrieved/);
  answer.context.text = 'See https://fabricated.example for a commentary.';
  assert.throws(() => validateStudy(answer, sources), /outside the retrieved/);
  answer.context.text = 'John 15:4–5 explains the vine image.';
  assert.doesNotThrow(() => validateStudy(answer, sources));
});

test('Bible chapter endpoint preserves attribution and rejects mismatched or unreportable sources', async () => {
  const config = loadConfig(liveEnv); let mismatch = false, omitToken = false;
  const calls = [];
  const providers = createLiveProviders(config, async (url) => {
    calls.push(url);
    if (!url.includes('/chapters/')) return Response.json({ data: { abbreviation: 'KJV', copyright: 'Test attribution', info: 'Translation information' } });
    return Response.json({ data: { id: 'PSA.23', bibleId: mismatch ? 'wrong-translation' : 'licensed-test', reference: 'Psalms 23', content: 'Test provider text', verseCount: 6 }, meta: omitToken ? {} : { fumsToken: 'test-only' } });
  });
  const source = await providers.bible('Psalm 23');
  assert.equal(source.info, 'Translation information'); assert.ok(calls[1].includes('/chapters/PSA.23?'));
  mismatch = true; await assert.rejects(() => providers.bible('Psalm 23'), /different passage or translation/);
  mismatch = false; omitToken = true; await assert.rejects(() => providers.bible('Psalm 23'), /usage-reporting/);
});

test('unfinished cost reservations survive process-store restarts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tcf-restart-'));
  const config = loadConfig({ ...liveEnv, DATA_DIR: dir, DAILY_BUDGET_USD: '0.03' });
  let store = createStore(config);
  try {
    store.reserve(); store.close(); store = createStore(config);
    assert.equal(store.summary()[0].status, 'reserved');
    assert.throws(() => store.reserve(), /usage budget/);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('citation regression: chapter labels accepted, out-of-range verses and URLs rejected', async () => {
  const demo = createDemoProviders();
  const route = await demo.route('John 15:1–8', []);
  const original = await demo.study(route);
  const sources = [
    { id: 'S1', reference: 'Hebrews 6:4–8' },
    { id: 'S2', reference: 'John 10:27–29' },
    { id: 'S3', reference: 'Romans 8:38–39' },
  ];
  const copy = () => structuredClone(original);
  const valid = copy();
  for (const section of [valid.context, ...valid.observations, ...valid.interpretation, ...valid.theology, ...valid.connections, ...valid.application]) { section.evidence = ['S1']; section.text = 'A conclusion grounded in the supplied excerpt.'; }
  valid.title = 'A passage study';
  valid.furtherStudy = ['What does this passage emphasize?'];
  valid.caveat = '';
  // A chapter *label* matches a retrieved excerpt; it does not establish all chapter claims.
  valid.context.text = 'The warning appears in Hebrews 6; compare the retrieved verses in Romans 8.';
  assert.doesNotThrow(() => validateStudy(valid, sources));
  const wrongVerse = structuredClone(valid);
  wrongVerse.context.text = 'Read Romans 8:28 for the explanation.';
  assert.throws(() => validateStudy(wrongVerse, sources), /outside the retrieved Scripture/);
  const wrongChapter = structuredClone(valid);
  wrongChapter.furtherStudy[0] = 'Study Romans 9 for the next step.';
  assert.throws(() => validateStudy(wrongChapter, sources), /outside the retrieved Scripture/);
  const unknownId = structuredClone(valid);
  unknownId.theology[0].evidence = ['S99'];
  assert.throws(() => validateStudy(unknownId, sources), /unverified reference/);
  const inventedUrl = structuredClone(valid);
  inventedUrl.caveat = 'Visit https://invented.example for sources.';
  assert.throws(() => validateStudy(inventedUrl, sources), /outside the retrieved Scripture/);
});


test('Phase 2: overlapping supporting references are excluded, preserving distinct ones', () => {
  const route = supporting => ({ kind: 'passage', question: 'Study the text', main: 'John 15:1–8', supporting });
  assert.deepEqual(validateRouteSources(route(['John 14:21', 'Galatians 5:22–23'])).supporting, ['John 14:21', 'Galatians 5:22–23']);
  for (const supporting of [
    ['John 15:1–8'], ['John 15:5'], ['John 15'],
  ]) assert.deepEqual(validateRouteSources(route(supporting)).supporting, []);
  assert.deepEqual(validateRouteSources(route(['Romans 8:38–39', 'Romans 8:39'])).supporting, ['Romans 8:38–39']);
  assert.deepEqual(validateRouteSources(route(['John 14:21', 'John 14:21'])).supporting, ['John 14:21']);
  assert.throws(() => validateRouteSources(route(['John 0:1'])), /supporting passage was invalid/);
  assert.deepEqual(validateRouteSources(route(['John 15:9–12'])).supporting, ['John 15:9–12']);
});


test('Phase 2 evidence strength is required and constrained by study section', async () => {
  const demo = createDemoProviders();
  const route = await demo.route('John 15:1–8', []);
  const original = await demo.study(route);
  const sources = [{ id: 'S1', reference: 'John 15:1–8' }, { id: 'S2', reference: 'John 14:21' }, { id: 'S3', reference: 'Galatians 5:22–23' }];
  assert.doesNotThrow(() => validateStudy(original, sources));
  const withoutLabel = structuredClone(original);
  delete withoutLabel.observations[0].strength;
  assert.throws(() => validateStudy(withoutLabel, sources), /could not be verified/);
  const wrongSection = structuredClone(original);
  wrongSection.application[0].strength = 'direct_text';
  assert.equal(validateStudy(wrongSection, sources).application[0].strength, 'pastoral_application');
  const unknownLabel = structuredClone(original);
  unknownLabel.theology[0].strength = 'high_confidence';
  assert.throws(() => validateStudy(unknownLabel, sources), /could not be verified/);
  const unknownEvidence = structuredClone(original);
  unknownEvidence.connections[0].evidence = ['S404'];
  assert.throws(() => validateStudy(unknownEvidence, sources), /unverified reference/);
});


test('selection rationales only claim connections substantiated by study evidence IDs', async () => {
  const demo = createDemoProviders();
  const route = await demo.route('John 15:1–8', []);
  const study = await demo.study(route);
  const sources = [{ id: 'S1', role: 'Main passage' }, { id: 'S2', role: 'Supporting Scripture' }, { id: 'S3', role: 'Supporting Scripture' }, { id: 'S4', role: 'Immediate context' }];
  const reasoned = explainSources(study, sources);
  assert.match(reasoned[0].selectionReason, /Controlling passage/);
  assert.match(reasoned[1].selectionReason, /listed for the reader to compare/);
  assert.match(reasoned[2].selectionReason, /cross-reference section/);
  assert.match(reasoned[3].selectionReason, /preceding verses/);
  const withoutConnection = structuredClone(study);
  withoutConnection.connections = [];
  assert.match(explainSources(withoutConnection, sources)[1].selectionReason, /does not establish/);
  assert.equal(sources[1].selectionReason, undefined);
});

test('overlapping supporting references are omitted instead of rejecting 2 Timothy 3:15', () => {
 const route = validateRouteSources({ kind:'passage', question:'Study 2 Timothy 3:15',
  main:'2 Timothy 3:15', supporting:['2 Timothy 3:14–17','Psalm 119:105'] });
 assert.equal(route.main,'2 Timothy 3:15');
 assert.deepEqual(route.supporting,['Psalms 119:105']);
 const duplicate = validateRouteSources({ kind:'passage', question:'Study 2 Timothy 3:15',
  main:'2 Timothy 3:15', supporting:['2 Timothy 3:15','2 Timothy 3:14–16'] });
 assert.deepEqual(duplicate.supporting,[]);
 assert.throws(() => validateRouteSources({ kind:'passage', main:'2 Timothy 3:15',
  supporting:['not a Bible passage'] }), /invalid/i);
});
