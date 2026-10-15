import assert from 'node:assert/strict';
import { loadConfig } from '../server/config.js';
const config = loadConfig();
const root = `http://127.0.0.1:${config.PORT}`;
async function request(path, options = {}) {
  const response = await fetch(root + path, { ...options, signal: AbortSignal.timeout(160_000) });
  const data = await response.json();
  assert.ok(response.ok, `Readiness request failed (${response.status}): ${data.error?.code || 'unknown'}`);
  return data;
}
const health = await request('/api/health'); assert.equal(health.mode, config.APP_MODE);
const session = await request('/api/config');
const headers = { Origin: config.PUBLIC_ORIGIN, 'Content-Type': 'application/json', 'X-TCF-Session': session.sessionToken };
const answer = await request('/api/chat', { method: 'POST', headers, body: JSON.stringify({ message: 'Study John 15:1–8' }) });
assert.equal(answer.mode, config.APP_MODE); assert.ok(answer.study?.observations.length);
assert.ok(answer.sources[0].text); assert.match(answer.sources[0].reference, /John 15/);
const ids = new Set(answer.sources.map(source => source.id));
assert.ok(answer.study.context.evidence.every(id => ids.has(id)));
await request('/api/session/reset', { method: 'POST', headers, body: '{}' });
console.log(`Readiness passed: ${config.APP_MODE} passage study, source text, citations, and reset. No session tokens or conversation text logged.`);
