import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectStudyWorkflow, runRoutedStudy } from '../packages/kv-study-engine/router.js';

test('KV router fails closed on unapproved or malformed modes', () => {
  for (const kind of ['passage','question']) assert.equal(selectStudyWorkflow({kind}).supported,true);
  for (const kind of ['inductive','topical','original-language','audit','unsupported']) assert.equal(selectStudyWorkflow({kind}).supported,false);
  assert.equal(selectStudyWorkflow(null).supported,false);
  assert.equal(selectStudyWorkflow({kind:'__proto__'}).supported,false);
});

test('KV routed study keeps one route, one retrieval, one checked synthesis', async () => {
  const calls = [];
  const providers = {
    route: async () => { calls.push('route'); return {kind:'passage',main:'2 Timothy 3:15',supporting:[],question:'Study the text'}; },
    study: async () => { calls.push('study'); return {title:'Study'}; }
  };
  const result = await runRoutedStudy({
    message:'2 Timothy 3:15',history:[],meter:{cost:0},providers,
    normalizeRoute: route => { calls.push('normalize'); return route; },
    retrieveSources: async () => { calls.push('retrieve'); return [{id:'S1',reference:'2 Timothy 3:15'}]; },
    verifyStudy: study => { calls.push('verify'); return study; },
  });
  assert.deepEqual(calls,['route','normalize','retrieve','study','verify']);
  assert.equal(result.contract.controllingReference,'2 Timothy 3:15');
  assert.equal(result.workflow.supported,true);
});

test('unsupported routes never retrieve Scripture or call study generator', async () => {
  const result = await runRoutedStudy({
    message:'Write a sermon',history:[],providers:{
      route:async()=>({kind:'unsupported',main:'',supporting:[]}),
      study:async()=>{throw Error('study must not run');}
    },
    normalizeRoute:route=>route,
    retrieveSources:async()=>{throw Error('retrieval must not run');},
    verifyStudy:()=>{throw Error('verification must not run');},
  });
  assert.equal(result.workflow.supported,false);
  assert.deepEqual(result.sources,[]);
});

test('route normalization receives complete follow-up history and question', async () => {
  const history=[{question:'Study John 15:1–8',answer:{sources:[{reference:'John 15:1–8'}]}}];
  let observed;
  await runRoutedStudy({
    message:'Explain this passage',history,providers:{
      route:async()=>({kind:'question',main:'John 15:1–8',supporting:[]}),
      study:async()=>({title:'Continuing study'})
    },
    normalizeRoute:(route,message,previous)=>{observed={route,message,previous};return route;},
    retrieveSources:async()=>[{id:'S1',reference:'John 15:1–8'}],
    verifyStudy:s=>s
  });
  assert.equal(observed.message,'Explain this passage');
  assert.strictEqual(observed.previous,history);
});

test('invalid source IDs fail before a model can generate study', async () => {
  let generated=false;
  await assert.rejects(()=>runRoutedStudy({
    message:'Study John 15',history:[],providers:{
      route:async()=>({kind:'passage',main:'John 15',supporting:[]}),
      study:async()=>{generated=true;return {};},
    },normalizeRoute:r=>r,retrieveSources:async()=>[{id:'S1',reference:'John 15'},{id:'S1',reference:'John 14'}],verifyStudy:s=>s
  }),/unique/);
  assert.equal(generated,false);
});
