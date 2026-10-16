import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createDiscoveryRouter } from '../server/mcp-discovery.js';
import { loadConfig } from '../server/config.js';
const token = 'test-mcp-token-longer-than-thirty-two-bytes-123456';
async function serve(run) {
  const app = express();
  app.use('/mcp', createDiscoveryRouter({ token, origin:'http://localhost:3000' }));
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const url = 'http://127.0.0.1:' + server.address().port + '/mcp';
    const call = async (body, auth=token, extras={}) => {
      const res = await fetch(url, { method:'POST',
        headers:{'Content-Type':'application/json',...(auth ? {Authorization:'Bearer '+auth}:{}),...extras},
        body: JSON.stringify(body) });
      return {status:res.status, body:res.status===202 ? null : await res.json()};
    };
    await run({url,call});
  } finally { await new Promise(resolve => server.close(resolve)); }
}
test('MCP discovery disabled without a configured token', () => {
  assert.equal(loadConfig({APP_MODE:'demo'}).MCP_DISCOVERY_TOKEN,'');
  assert.throws(()=>loadConfig({APP_MODE:'demo',MCP_DISCOVERY_TOKEN:'short'}),/MCP_DISCOVERY_TOKEN/);
});
test('MCP discovery needs a bearer token and rejects browser origins', async () => serve(async ({call}) => {
  const request={jsonrpc:'2.0',id:1,method:'tools/list'};
  assert.equal((await call(request,null)).status,401);
  assert.equal((await call(request,'wrong')).status,401);
  assert.equal((await call(request,token,{Origin:'https://random.example'})).status,403);
}));
test('MCP protocol discovery exposes exactly one read-only tool', async () => serve(async ({call}) => {
  const init=await call({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'test',version:'1'}}});
  assert.equal(init.status,200);
  assert.equal(init.body.result.protocolVersion,'2025-03-26');
  const listed=await call({jsonrpc:'2.0',id:2,method:'tools/list'});
  assert.deepEqual(listed.body.result.tools.map(x=>x.name),['kv_engine_capabilities']);
  const caps=await call({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'kv_engine_capabilities',arguments:{}}});
  const details=JSON.parse(caps.body.result.content[0].text);
  assert.equal(details.studyExecutionAvailable,false);
  assert.deepEqual(details.enabledModes,['passage','question']);
  assert.equal((await call({jsonrpc:'2.0',method:'notifications/initialized'})).status,202);
}));
test('MCP refuses study execution, unsupported calls, and JSON-RPC invalid input', async () => serve(async ({call}) => {
  const badTool=await call({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'study.execute',arguments:{message:'John 15'}}});
  assert.equal(badTool.body.error.code,-32602);
  const badMethod=await call({jsonrpc:'2.0',id:5,method:'engine.execute'});
  assert.equal(badMethod.body.error.code,-32601);
  const malformed=await call({jsonrpc:'2.0',method:'tools/list'});
  assert.equal(malformed.status,400);
}));
