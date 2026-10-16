import { createHash, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { ENGINE_VERSION } from '../packages/kv-study-engine/engine.js';
import { INTERFACE_VERSION } from '../packages/kv-study-engine/interface.js';

// Stateless, read-only MCP discovery. No study execution or private sources.
const TOOLS = Object.freeze([{
  name: 'kv_engine_capabilities',
  description: 'Discover enabled TCF KV Study Engine modes and public API limitations. Does not execute studies.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
}]);
const MODES = Object.freeze(['passage', 'question']);
const CAPABILITIES = Object.freeze({
  engineVersion: ENGINE_VERSION, interfaceVersion: INTERFACE_VERSION,
  enabledModes: MODES, studyExecutionAvailable: false,
  formalAuditsAvailable: false, originalLanguageResearchAvailable: false,
  note: 'Discovery only. Use the existing TCF Bible Study Assistant to request a study.',
});
function reply(id, result) { return { jsonrpc: '2.0', id, result }; }
function failure(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } }; }
function authenticate(header, secret) {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const value = header.slice(7);
  const provided = Buffer.from(createHash('sha256').update(value).digest());
  const expected = Buffer.from(createHash('sha256').update(secret).digest());
  return value.length > 0 && timingSafeEqual(provided, expected);
}
export function createDiscoveryRouter({ token, origin, rateLimit } = {}) {
  if (typeof token !== 'string' || token.length < 32) throw new Error('MCP discovery requires a long server-side token');
  if (typeof origin !== 'string' || !/^https?:\/\//.test(origin)) throw new Error('MCP discovery requires an exact public origin');
  const router = express.Router();
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use((req, res, next) => {
    const callerOrigin = req.get('origin');
    // Browser origins are not allowed: intended for server-side MCP clients.
    if (callerOrigin) return res.status(403).json(failure(null, -32003, 'Browser-origin MCP requests are disabled'));
    if (!authenticate(req.get('authorization'), token)) {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json(failure(null, -32001, 'Unauthorized'));
    }
    if (rateLimit) {
      try { rateLimit(req.ip); } catch { return res.status(429).json(failure(null, -32029, 'Rate limit exceeded')); }
    }
    next();
  });
  router.post('/', express.json({ limit: '8kb', type: 'application/json' }), (req, res) => {
    const data = req.body;
    if (!data || Array.isArray(data) || typeof data !== 'object' || data.jsonrpc !== '2.0' ||
        typeof data.method !== 'string' || !('id' in data) ||
        !(typeof data.id === 'string' || typeof data.id === 'number') ||
        (typeof data.id === 'number' && !Number.isFinite(data.id))) {
      return res.status(400).json(failure(null, -32600, 'Invalid JSON-RPC request'));
    }
    const { id, method } = data;
    if (method === 'initialize') return res.json(reply(id, {
      protocolVersion: '2025-03-26',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'tcf-kv-discovery', version: '0.1.0' },
    }));
    if (method === 'tools/list') return res.json(reply(id, { tools: TOOLS }));
    if (method === 'tools/call') {
      if (data.params?.name !== 'kv_engine_capabilities' ||
          !data.params?.arguments || Array.isArray(data.params.arguments) ||
          typeof data.params.arguments !== 'object' || Object.keys(data.params.arguments).length) {
        return res.json(failure(id, -32602, 'Unknown tool or invalid arguments'));
      }
      return res.json(reply(id, { content: [{ type: 'text', text: JSON.stringify(CAPABILITIES) }] }));
    }
    return res.json(failure(id, -32601, 'Method not found'));
  });
  // Notifications are permitted after initialization; stateless server keeps no session.
  router.post('/', (_req, res) => res.sendStatus(400));
  router.get('/', (_req, res) => res.status(405).set('Allow', 'POST').end());
  router.delete('/', (_req, res) => res.status(405).set('Allow', 'POST').end());
  return router;
}
