import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngineInterface, INTERFACE_VERSION } from '../packages/kv-study-engine/interface.js';

function fixture() {
 const calls=[];
 const iface=createEngineInterface({
  providers:{route:async()=>{calls.push('route');return {kind:'passage',main:'John 15:1–8',supporting:[]};},
   study:async()=>{calls.push('study');return {title:'The Vine'};}},
  normalizeRoute:r=>r,
  retrieveSources:async()=>{calls.push('retrieve');return [{id:'S1',reference:'John 15:1–8'}];},
  verifyStudy:s=>{calls.push('verify');return s;}
 });
 return {iface,calls};
}
test('interface exposes versioned, closed operation registry without network endpoints', () => {
 const {iface}=fixture();
 assert.equal(iface.describe().interfaceVersion,'1.0');
 assert.equal(iface.describe().remoteAccess,false);
 assert.deepEqual(iface.describe().enabledModes,['passage','question']);
 assert.deepEqual(iface.describe().operations,['study.execute','engine.describe']);
 assert.ok(Object.isFrozen(iface));
});
test('unauthorized caller cannot run or even describe interface operations', async () => {
 const {iface,calls}=fixture();
 await assert.rejects(()=>iface.invoke({version:INTERFACE_VERSION,operation:'study.execute'},{}),/ENGINE_ACCESS_DENIED/);
 await assert.rejects(()=>iface.invoke({version:INTERFACE_VERSION,operation:'engine.describe'}),/ENGINE_ACCESS_DENIED/);
 assert.deepEqual(calls,[]);
});
test('authorized bounded study delegates to the existing verified pipeline', async () => {
 const {iface,calls}=fixture();
 const result=await iface.invoke({version:INTERFACE_VERSION,operation:'study.execute',
  message:'Study John 15:1–8',history:[],meter:{cost:0}},iface.capability);
 assert.equal(result.contract.controllingReference,'John 15:1–8');
 assert.deepEqual(calls,['route','retrieve','study','verify']);
});
test('unknown versions, operations, and oversized inputs fail before provider call', async () => {
 const {iface,calls}=fixture();
 for(const request of [
  {version:'2.0',operation:'engine.describe'},
  {version:INTERFACE_VERSION,operation:'audit.execute'},
  {version:INTERFACE_VERSION,operation:'study.execute',message:'x'.repeat(1501),history:[],meter:{}},
  {version:INTERFACE_VERSION,operation:'study.execute',message:'John 15',history:new Array(21).fill({}),meter:{}},
 ]) await assert.rejects(()=>iface.invoke(request,iface.capability),/(Unsupported|Invalid)/);
 assert.deepEqual(calls,[]);
});
