import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCommentaryPilot } from '../server/commentary-pilot.js';
import { createLiveProviders, validateCommentaryInsight, WEB_BIBLE_ID } from '../server/providers.js';
import { loadConfig } from '../server/config.js';
import { formatStudyNotes } from '../public/study-export.js';

const source = { id: 'S1', reference: 'John 15:4', text: 'Remain in me, and I in you. As the branch cannot bear fruit of itself, unless it remains in the vine, so neither can you, unless you remain in me.',
  translation: 'WEB', bibleId: WEB_BIBLE_ID, copyright: 'PUBLIC DOMAIN' };
const entry = (text, strength) => ({ text, evidence: ['S1'], strength });
const study = {
  title: 'Remaining with Christ',
  context: entry('The branch image frames the passage.', 'contextual_inference'),
  observations: [entry('The branch depends on the vine.', 'direct_text')],
  interpretation: [entry('The comparison invites attention to dependence.', 'contextual_inference')],
  theology: [entry('The image describes a relationship with Christ.', 'theological_synthesis')],
  connections: [],
  application: [entry('Consider how this image shapes daily life.', 'pastoral_application')],
  furtherStudy: ['What does the branch image emphasize?'],
  caveat: '',
};

test('pilot selects only the two bounded governing passages and uses BLB verse links', () => {
  const john = getCommentaryPilot('John 15:1–8');
  assert.equal(john.id, 'TOSN-JHN-15-4');
  assert.equal(john.reference, 'John 15:4');
  assert.deepEqual(john.keywords, ['remain', 'vine']);
  assert.equal(john.blbUrl, 'https://www.blueletterbible.org/kjv/jhn/15/4/');
  assert.equal(getCommentaryPilot('John 15:5'), null);
  assert.equal(getCommentaryPilot('Psalms 23').id, 'TOSN-PSA-23-1');
  assert.equal(getCommentaryPilot('Psalms 23:2–4'), null);
  assert.equal(getCommentaryPilot('Romans 8:1'), null);
});

test('pilot commentary insight rejects mismatched notes, invented links, and Strong claims', () => {
  const note = getCommentaryPilot('John 15:4');
  assert.deepEqual(validateCommentaryInsight({ noteId: note.id, text: 'The branch image stresses dependence.' }, note, [source]),
    { noteId: note.id, text: 'The branch image stresses dependence.' });
  for (const value of [
    { noteId: 'OTHER', text: 'The branch image stresses dependence.' },
    { noteId: note.id, text: 'This is Strong’s G3306.' },
    { noteId: note.id, text: 'See https://example.com.' },
    { noteId: note.id, text: 'Compare Romans 8:1.' },
  ]) assert.throws(() => validateCommentaryInsight(value, note, [source]));
});

test('enabled pilot sends the bounded note to generation and returns an attributed insight', async () => {
  let request;
  const config = loadConfig({ APP_MODE: 'live', TCF_OPENAI_API_KEY: 'test-openai', TCF_BIBLE_API_KEY: 'test-bible',
    BIBLE_ID: WEB_BIBLE_ID, COMMENTARY_PILOT_ENABLED: 'true' });
  const providers = createLiveProviders(config, async (url, options) => {
    assert.match(url, /api\.openai\.com/);
    request = JSON.parse(options.body);
    return Response.json({ usage: { prompt_tokens: 100, completion_tokens: 100 },
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        ...study, commentaryInsight: { noteId: 'TOSN-JHN-15-4', text: 'The image invites readers to consider their continuing dependence on Christ.' },
      }) } }] });
  });
  const answer = await providers.study({ question: 'Study John 15:4' }, [source], { cost: 0, input: 0, output: 0 });
  assert.equal(answer.commentaryInsight.noteId, 'TOSN-JHN-15-4');
  assert.equal(JSON.parse(request.messages[1].content).commentaryNote.id, 'TOSN-JHN-15-4');
  assert.ok(request.response_format.json_schema.schema.properties.commentaryInsight);
  const exported = formatStudyNotes({ study: answer, sources: [source], commentaryPilot: getCommentaryPilot('John 15:4') });
  assert.match(exported, /Adapted from Tyndale Open Study Notes/);
  assert.match(exported, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
  assert.doesNotMatch(exported, /Remain in me, and I in you/);
});

test('disabled pilot leaves the generation payload and response unchanged', async () => {
  let request;
  const config = loadConfig({ APP_MODE: 'live', TCF_OPENAI_API_KEY: 'test-openai', TCF_BIBLE_API_KEY: 'test-bible',
    BIBLE_ID: WEB_BIBLE_ID });
  const providers = createLiveProviders(config, async (_url, options) => {
    request = JSON.parse(options.body);
    return Response.json({ usage: { prompt_tokens: 100, completion_tokens: 100 },
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(study) } }] });
  });
  const answer = await providers.study({ question: 'Study John 15:4' }, [source], { cost: 0, input: 0, output: 0 });
  assert.equal(answer.commentaryInsight, undefined);
  assert.equal(JSON.parse(request.messages[1].content).commentaryNote, undefined);
  assert.equal(request.response_format.json_schema.schema.properties.commentaryInsight, undefined);
});

test('Render PR preview isolates origin, data, and spending from production settings', () => {
  const config = loadConfig({ APP_MODE: 'live', TCF_OPENAI_API_KEY: 'test-openai', TCF_BIBLE_API_KEY: 'test-bible',
    BIBLE_ID: WEB_BIBLE_ID, IS_PULL_REQUEST: 'true', RENDER_EXTERNAL_URL: 'https://tcf-preview.onrender.com',
    PUBLIC_ORIGIN: 'https://tcf-study-app.onrender.com', DATA_DIR: '/var/data/tcf',
    COMMENTARY_PILOT_ENABLED: 'false', DAILY_BUDGET_USD: '2', MONTHLY_BUDGET_USD: '20' });
  assert.equal(config.PUBLIC_ORIGIN, 'https://tcf-preview.onrender.com');
  assert.equal(config.DATA_DIR, '/tmp/tcf-commentary-preview');
  assert.equal(config.COMMENTARY_PILOT_ENABLED, true);
  assert.equal(config.DAILY_BUDGET_USD, 1);
  assert.equal(config.MONTHLY_BUDGET_USD, 2);
  assert.throws(() => loadConfig({ IS_PULL_REQUEST: 'true' }), /Render preview URL is required/);
});
