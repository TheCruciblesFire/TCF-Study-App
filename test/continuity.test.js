import { test } from 'node:test';
import assert from 'node:assert/strict';
import { continuingPassage, preserveFollowupPassage } from '../server/continuity.js';

const previous = [{ question: 'Study John 15:1–8', answer: { study: { title: 'The Vine' },
  sources: [{ reference: 'John 15:1–8' }] } }];
const wrongRoute = { kind:'question', question:'Explain verse 6', main:'Romans 8:1–4', supporting:['John 15:1–8'] };

test('explicit conversational follow-ups retain last verified controlling passage', () => {
 assert.equal(continuingPassage('Explain verse 6 further', previous), 'John 15:1–8');
 assert.equal(continuingPassage('How can I apply this today?', previous), 'John 15:1–8');
 const route = preserveFollowupPassage(wrongRoute,'Explain verse 6 further',previous);
 assert.equal(route.main, 'John 15:1–8');
 assert.deepEqual(route.supporting, []);
});
test('new explicit Scripture requests and independent questions are not inherited', () => {
 assert.equal(continuingPassage('How does Romans 8:1–4 compare to this?', previous), null);
 assert.equal(continuingPassage('What is grace?', previous), null);
 assert.equal(continuingPassage('Explain verse 6 further', []), null);
 const route = preserveFollowupPassage(wrongRoute, 'What is grace?', previous);
 assert.equal(route.main, 'Romans 8:1–4');
 assert.equal(preserveFollowupPassage({ kind:'unsupported', main:'', supporting:[] }, 'Explain this',previous).kind,'unsupported');
});
test('continuation prefers most recent completed study over unsupported turns', () => {
 const history = [...previous, {question:'unrelated',answer:{study:null,sources:[]}}];
 assert.equal(continuingPassage('What does this mean?',history),'John 15:1–8');
});
